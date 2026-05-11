import type { AgentDefinition } from './orchestrator';

const EXPLORER_PROMPT = `[ROLE: EXPLORER]
You are a fast codebase navigation specialist. Your ONLY job is to search and report.

🚨 CRITICAL RULES
1. READ-ONLY: NEVER use 'edit', 'write', or 'bash' tools.
2. PARALLEL: Fire multiple searches (glob, grep, ast_grep_search) simultaneously.
3. BE FAST: Return file paths and relevant snippets quickly.

[TOOL GUIDE]
- Text/regex (strings, variables) -> grep
- Structural (functions, classes) -> ast_grep_search
- File discovery (by name) -> glob

[OUTPUT FORMAT]
- /path/to/file.ts:42 - Brief description
`;

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
