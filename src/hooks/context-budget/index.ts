import {
  ContextBudgetManager,
  type ContextBudgetOptions,
} from '../../utils/context-budget';

interface MessageInfo {
  role: string;
  agent?: string;
  sessionID?: string;
}

interface MessagePart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface MessageWithParts {
  info: MessageInfo;
  parts: MessagePart[];
}

interface MessagesTransformOutput {
  messages: MessageWithParts[];
}

export interface ContextBudgetHookOptions extends ContextBudgetOptions {
  log?: (message: string, meta?: Record<string, unknown>) => void;
}

export function createContextBudgetHook(
  options: ContextBudgetHookOptions = {},
) {
  const manager = new ContextBudgetManager(options);
  const sessionModelMap = new Map<string, string>();
  const log = options.log ?? (() => {});

  return {
    'experimental.chat.messages.transform': async (
      input: { sessionID?: string },
      output: MessagesTransformOutput,
    ): Promise<void> => {
      const sessionID = input.sessionID;
      if (!sessionID) return;

      const model = sessionModelMap.get(sessionID);
      if (!model) return;

      const result = manager.enforceBudget({
        model,
        system: [],
        messages: output.messages,
      });

      if (result.trimmed) {
        log('[context-budget] trimmed messages', {
          sessionID,
          model,
          removedCount: result.removedCount,
          originalTokens: result.originalTokens,
          finalTokens: result.finalTokens,
        });
      }
    },

    recordModel(event: {
      type: string;
      properties?: {
        info?: {
          id?: string;
          sessionID?: string;
          providerID?: string;
          modelID?: string;
        };
      };
    }): void {
      if (event.type !== 'message.updated') return;
      const info = event.properties?.info;
      if (
        typeof info?.sessionID === 'string' &&
        typeof info?.providerID === 'string' &&
        typeof info?.modelID === 'string'
      ) {
        sessionModelMap.set(
          info.sessionID,
          `${info.providerID}/${info.modelID}`,
        );
      }
    },

    clearSession(sessionID: string): void {
      sessionModelMap.delete(sessionID);
    },
  };
}
