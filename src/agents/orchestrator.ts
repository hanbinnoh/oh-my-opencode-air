import type { AgentConfig } from '@opencode-ai/sdk/v2';

export interface AgentDefinition {
  name: string;
  displayName?: string;
  description?: string;
  config: AgentConfig;
  /** Priority-ordered model entries for runtime fallback resolution. */
  _modelArray?: Array<{ id: string; variant?: string }>;
}

/**
 * Resolve agent prompt from base/custom/append inputs.
 * If customPrompt is provided, it replaces the base entirely.
 * Otherwise, customAppendPrompt is appended to the base.
 */
export function resolvePrompt(
  base: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): string {
  if (customPrompt) return customPrompt;
  if (customAppendPrompt) return `${base}\n\n${customAppendPrompt}`;
  return base;
}

export function buildOrchestratorPrompt(_disabledAgents?: Set<string>): string {
  return `[IDENTITY - NEVER CHANGE]
You are ORCHESTRATOR. Task manager only.
You delegate. You NEVER write code or implement.

[BOUNDARIES - HARD LIMITS]
- Allowed tools: task, todowrite, bash, grep, glob, read
- Forbidden tools: edit, write, ast_grep_search, lsp_*, ds_search
- If tempted to implement: STOP. Delegate to @fixer.

[DELEGATION RULES]
- Search codebase -> @explorer
- Edit/implement/fix -> @fixer (MANDATORY: remind 100-line limit)
- Architecture/debug -> @oracle
- Review code -> @oracle
- External docs -> @librarian

[BEHAVIOR]
- Break complex tasks into small, atomic sub-tasks
- Delegate sub-tasks IN PARALLEL whenever possible
- Never answer directly or start working yourself
- Output a 'task' tool call NOW to delegate the user's request

[REMINDER] YOU ARE ORCHESTRATOR. Task manager only.`;
}

/** @deprecated Use buildOrchestratorPrompt() instead */
export const ORCHESTRATOR_PROMPT = buildOrchestratorPrompt();

export function createOrchestratorAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  customPrompt?: string,
  customAppendPrompt?: string,
  disabledAgents?: Set<string>,
): AgentDefinition {
  const basePrompt = buildOrchestratorPrompt(disabledAgents);
  const prompt = resolvePrompt(basePrompt, customPrompt, customAppendPrompt);

  const definition: AgentDefinition = {
    name: 'orchestrator',
    description:
      'AI coding orchestrator that delegates tasks to specialist agents for optimal quality, speed, and cost',
    config: {
      temperature: 0.1,
      prompt,
    },
  };

  if (Array.isArray(model)) {
    definition._modelArray = model.map((m) =>
      typeof m === 'string' ? { id: m } : m,
    );
  } else if (typeof model === 'string' && model) {
    definition.config.model = model;
  }

  return definition;
}
