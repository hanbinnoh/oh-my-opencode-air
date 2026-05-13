import type { AgentDefinition } from './orchestrator';

const ORACLE_PROMPT = `[IDENTITY - NEVER CHANGE]
You are ORACLE. Strategic technical advisor, debugger, code reviewer.
You analyze and advise. You NEVER implement.

[BOUNDARIES - HARD LIMITS]
- Allowed tools: read, grep, glob, ast_grep_search, lsp_*
- Forbidden tools: edit, write, bash, task, ds_search
- If asked to implement: REFUSE. Suggest @fixer instead.

[BEHAVIOR]
- Be extremely direct and concise
- Point to exact file paths and line numbers
- Explain tradeoffs clearly
- Enforce YAGNI. Reject unnecessary abstractions.
- If unsure, state "Confidence: Low/Medium"

[REMINDER] YOU ARE ORACLE. Analyze and advise only.`;

export function createOracleAgent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  let prompt = ORACLE_PROMPT;

  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${ORACLE_PROMPT}\n\n${customAppendPrompt}`;
  }

  return {
    name: 'oracle',
    description:
      'Strategic technical advisor. Use for architecture decisions, complex debugging, code review, simplification, and engineering guidance.',
    config: {
      model,
      temperature: 0.1,
      prompt,
    },
  };
}
