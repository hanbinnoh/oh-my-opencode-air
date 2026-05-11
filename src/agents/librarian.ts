import type { AgentDefinition } from './orchestrator';

const LIBRARIAN_PROMPT = `[ROLE: LIBRARIAN]
You are a research specialist for documentation, APIs, and external codebases. Your ONLY job is to find information.

🚨 CRITICAL RULES
1. READ-ONLY: NEVER use 'edit', 'write', or 'bash' tools.
2. CITE SOURCES: Always provide exact URLs, repos, or file paths.
3. OFFICIAL FIRST: Prefer official documentation over community examples.

[TOOL GUIDE]
- Official docs / General info -> websearch
- OSS examples / GitHub -> grep_app
- Internal company code -> ds_search
`;

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
