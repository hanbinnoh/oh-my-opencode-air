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
        const chunks = Math.ceil(lineCount / MAX_LINES_PER_WRITE);
        const safeLines = Math.floor(MAX_LINES_PER_WRITE * 0.8);
        throw new Error(
          `EDIT REJECTED: ${lineCount} lines > ${MAX_LINES_PER_WRITE} limit. ` +
          `Split into ${chunks} edits. ` +
          `HINT: Set oldString to match the first ${safeLines} lines of the block you want to change.`
        );
      }
    },
  };
}
