/**
 * Write constraint hook — enforces 100-line limit per edit/write tool call.
 * The on-premise server has a bug where writing >100 lines causes an
 * infinite loop error. This hook rejects oversized writes before they
 * reach the server.
 */

const MAX_LINES_PER_WRITE = 100;

const WRITE_TOOLS = new Set(['edit', 'Edit', 'write', 'Write']);

interface ToolExecuteBeforeInput {
  tool: string;
  sessionID?: string;
  callID?: string;
}

interface ToolExecuteBeforeOutput {
  args?: {
    content?: string;
    newString?: string;
    oldString?: string;
    [key: string]: unknown;
  };
}

function countLines(text: string | undefined): number {
  if (!text) return 0;
  return text.split('\n').length;
}

export function createWriteConstraintHook() {
  return {
    'tool.execute.before': async (
      input: ToolExecuteBeforeInput,
      output: ToolExecuteBeforeOutput,
    ): Promise<void> => {
      if (!WRITE_TOOLS.has(input.tool)) {
        return;
      }

      const args = output.args;
      if (!args) return;

      // For write tool: check 'content'
      // For edit tool: check 'newString'
      const contentToCheck = args.content ?? args.newString;
      if (!contentToCheck) return;

      const lineCount = countLines(contentToCheck);

      if (lineCount > MAX_LINES_PER_WRITE) {
        throw new Error(
          `[write-constraint] Rejected: ${lineCount} lines exceeds ${MAX_LINES_PER_WRITE}-line limit. ` +
            `Split into multiple edit calls targeting chunks. ` +
            `Example: use 'edit' for lines 1-75, then another 'edit' for lines 76-150. ` +
            `This is a hard server constraint — violating it causes an infinite loop.`,
        );
      }
    },
  };
}
