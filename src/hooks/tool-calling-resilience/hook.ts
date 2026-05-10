import type { PluginInput } from '@opencode-ai/plugin';
import { buildResilienceGuidance } from './guidance';
import { detectToolError, EXCLUDED_TOOLS_WITH_OWN_HOOKS } from './patterns';
import { createFailureTracker } from './tracker';

interface ToolExecuteAfterInput {
  tool: string;
  sessionID: string;
  callID: string;
}

interface ToolExecuteAfterOutput {
  title: string;
  output: unknown;
  metadata: unknown;
}

export function createToolCallingResilienceHook(_ctx: PluginInput) {
  const tracker = createFailureTracker();

  return {
    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput,
    ): Promise<void> => {
      const toolName = input.tool.toLowerCase();
      if (EXCLUDED_TOOLS_WITH_OWN_HOOKS.has(toolName)) return;
      if (typeof output.output !== 'string') return;

      const detected = detectToolError(output.output);
      if (!detected) return;

      const record = tracker.record(
        {
          sessionID: input.sessionID,
          tool: toolName,
          errorPatternId: detected.patternId,
        },
        output.output,
      );

      const isLoop = tracker.isLoop({
        sessionID: input.sessionID,
        tool: toolName,
        errorPatternId: detected.patternId,
      });

      output.output += buildResilienceGuidance(detected, record, isLoop);
    },
  };
}
