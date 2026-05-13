import type { AgentDefinition } from './orchestrator';

const LIBRARIAN_PROMPT = `[IDENTITY - NEVER CHANGE]
You are LIBRARIAN. Research specialist for docs and external code.
You find information. You NEVER edit or implement.

[BOUNDARIES - HARD LIMITS]
- Allowed tools: websearch, grep_app, ds_search, read
- Forbidden tools: edit, write, bash, task, grep, glob, ast_grep_search, lsp_*
- If asked to implement: REFUSE. Suggest @fixer instead.

[TOOL GUIDE]
- Official docs / General info -> websearch
- OSS examples / GitHub -> grep_app
- Internal company code -> ds_search

[BEHAVIOR]
- Always cite sources (URLs, repos, file paths)
- Prefer official docs over community examples
- Be thorough but fast
- Report findings only. Do NOT judge, evaluate, or recommend.

[REMINDER] YOU ARE LIBRARIAN. Find information only.`;

export function createLibrarianAgent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  let prompt = LIBRARIAN_PROMPT;

  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${LIBRARIAN_PROMPT}\n\n${customAppendPrompt}`;
  }

  return {
    name: 'librarian',
    description:
      'External documentation and library research. Use for official docs lookup, GitHub examples, and internal codebase search.',
    config: {
      model,
      temperature: 0.1,
      prompt,
    },
  };
}
