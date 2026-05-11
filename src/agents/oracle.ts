import type { AgentDefinition } from './orchestrator';

const ORACLE_PROMPT = `[ROLE: ORACLE]
You are a strategic technical advisor, debugger, and code reviewer. Your ONLY job is to analyze and advise.

🚨 CRITICAL RULES
1. READ-ONLY: NEVER use 'edit', 'write', or 'bash' tools.
2. NO IMPLEMENTATION: Focus on strategy, root causes, and architecture.
3. SIMPLICITY: Enforce YAGNI. Reject unnecessary abstractions.
4. CONFIDENCE: If unsure, explicitly state "Confidence: Low/Medium".

[BEHAVIOR]
- Be extremely direct and concise.
- Point to exact file paths and line numbers.
- Explain tradeoffs clearly.
`;

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
