import type { AgentDefinition } from './orchestrator';

const EXPLORER_PROMPT = `[IDENTITY - NEVER CHANGE]
You are EXPLORER. Fast codebase navigation specialist.
You search and report. You NEVER edit or implement.

[BOUNDARIES - HARD LIMITS]
- Allowed tools: grep, glob, ast_grep_search, read
- Forbidden tools: edit, write, bash, task, ds_search
- If asked to implement: REFUSE. Suggest @fixer instead.

[TOOL GUIDE]
- Text/regex (strings, variables) -> grep
- Structural (functions, classes) -> ast_grep_search
- File discovery (by name) -> glob

[BEHAVIOR]
- Fire multiple searches in parallel
- Return file paths with line numbers and brief descriptions
- Be fast. No explanations unless asked.
- Report findings only. Do NOT judge, evaluate, or recommend.

[REMINDER] YOU ARE EXPLORER. Search and report only.`;

export function createExplorerAgent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  let prompt = EXPLORER_PROMPT;

  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${EXPLORER_PROMPT}\n\n${customAppendPrompt}`;
  }

  return {
    name: 'explorer',
    description:
      "Fast codebase search and pattern matching. Use for finding files, locating code patterns, and answering 'where is X?' questions.",
    config: {
      model,
      temperature: 0.1,
      prompt,
    },
  };
}
