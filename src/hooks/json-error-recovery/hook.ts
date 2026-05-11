import type { PluginInput } from '@opencode-ai/plugin';

export const JSON_ERROR_TOOL_EXCLUDE_LIST = [
  'bash',
  'read',
  'glob',
  'webfetch',
  'grep_app_searchgithub',
  'websearch_web_search_exa',
] as const;

export const JSON_ERROR_PATTERNS = [
  /json parse error/i,
  /failed to parse json/i,
  /invalid json/i,
  /malformed json/i,
  /unexpected end of json input/i,
  /syntaxerror:\s*unexpected token.*json/i,
  /json[^\n]*expected '\}'/i,
  /json[^\n]*unexpected eof/i,
] as const;

const JSON_ERROR_REMINDER_MARKER =
  '[JSON PARSE ERROR] Invalid JSON.';
const JSON_ERROR_EXCLUDED_TOOLS = new Set<string>(JSON_ERROR_TOOL_EXCLUDE_LIST);

export const JSON_ERROR_REMINDER = `
[JSON PARSE ERROR] Invalid JSON.

Fix these exact mistakes:
1. NO Markdown: Do NOT wrap in \`\`\`json \`\`\`. Output raw JSON only.
2. Escape Quotes: Use \\" for quotes inside strings.
3. NO Trailing Commas: {"a": "b"} (O), {"a": "b",} (X).

Retry the tool call with corrected JSON.
`;

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

export function createJsonErrorRecoveryHook(_ctx: PluginInput) {
  return {
    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput,
    ): Promise<void> => {
      if (JSON_ERROR_EXCLUDED_TOOLS.has(input.tool.toLowerCase())) return;
      if (typeof output.output !== 'string') return;
      if (output.output.includes(JSON_ERROR_REMINDER_MARKER)) return;

      const outputText = output.output;

      const hasJsonError = JSON_ERROR_PATTERNS.some((pattern) =>
        pattern.test(outputText),
      );

      if (hasJsonError) {
        output.output += `\n${JSON_ERROR_REMINDER}`;
      }
    },
  };
}
