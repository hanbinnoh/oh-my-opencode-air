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

// Agent descriptions for the orchestrator prompt
const AGENT_DESCRIPTIONS: Record<string, string> = {
  explorer: `@explorer
- Role: Parallel search specialist for discovering unknowns across the codebase
- Permissions: Read files
- Stats: 2x faster codebase search than orchestrator, 1/2 cost of orchestrator
- Capabilities: Glob, grep, AST queries to locate files, symbols, patterns
- **Delegate when:** Need to discover what exists before planning • Parallel searches speed discovery • Need summarized map vs full contents • Broad/uncertain scope
- **Don't delegate when:** Know the path and need actual content • Need full file anyway • Single specific lookup • About to edit the file`,

  oracle: `@oracle
- Role: Strategic advisor for high-stakes decisions and persistent problems, code reviewer
- Permissions: Read files
- Stats: 5x better decision maker, problem solver, investigator than orchestrator, 0.8x speed of orchestrator, same cost.
- Capabilities: Deep architectural reasoning, system-level trade-offs, complex debugging, code review, simplification, maintainability review
- **Delegate when:** Major architectural decisions with long-term impact • Problems persisting after 2+ fix attempts • High-risk multi-system refactors • Costly trade-offs (performance vs maintainability) • Complex debugging with unclear root cause • Security/scalability/data integrity decisions • Genuinely uncertain and cost of wrong choice is high • When a workflow calls for a **reviewer** subagent • Code needs simplification or YAGNI scrutiny
- **Don't delegate when:** Routine decisions you're confident about • First bug fix attempt • Straightforward trade-offs • Tactical "how" vs strategic "should" • Time-sensitive good-enough decisions • Quick research/testing can answer
- **Rule of thumb:** Need senior architect review? → @oracle. Need code review or simplification? → @oracle. Just do it and PR? → yourself.`,

  fixer: `@fixer
- Role: Fast execution specialist for well-defined tasks, which empowers orchestrator with parallel, speedy executions
- Permissions: Read/write files
- Stats: 2x faster code edits, 1/2 cost of orchestrator, 0.8x quality of orchestrator
- Tools/Constraints: Execution-focused—no research, no architectural decisions
- **Delegate when:** For implementation work, think and triage first. If the change is non-trivial or multi-file, hand bounded execution to @fixer • Writing or updating tests • Tasks that touch test files, fixtures, mocks, or test helpers. Parallelization benefits: Task involves multiple folders and multiple files modificaiton, scoping work per folder and spawning parallel @fixers for each folder.
- **Don't delegate when:** Needs discovery/research/decisions • Single small change (<20 lines, one file) • Unclear requirements needing iteration • Explaining to fixer > doing • Tight integration with your current work • Sequential dependencies
- **Rule of thumb:** Explaining > doing? → yourself. Test file modifications and bounded implementation work usually go to @fixer. Bigger or lots of edits, splitting makes sense, parallelized by spawning @fixers per certain scope.`,
};

// Validation routing lines that reference agents
const VALIDATION_ROUTING = [
  '- Route code review, simplification, maintainability review, and YAGNI checks to @oracle',
  '- Route test writing, test updates, and changes touching test files to @fixer',
  '- Route multi-file search and discovery to @explorer',
  '- If a request spans multiple lanes, delegate only the lanes that add clear value',
];

/**
 * Build the orchestrator prompt with dynamic agent filtering.
 * @param disabledAgents - Set of disabled agent names to exclude from the prompt
 * @returns The complete orchestrator prompt string
 */
export function buildOrchestratorPrompt(disabledAgents?: Set<string>): string {
  // Filter agent descriptions
  const enabledAgents = Object.entries(AGENT_DESCRIPTIONS)
    .filter(([name]) => !disabledAgents?.has(name))
    .map(([, desc]) => desc)
    .join('\n\n');

  // Filter validation routing lines — remove lines mentioning any disabled agent
  const enabledValidationRouting = VALIDATION_ROUTING.filter((line) => {
    const mentions = [...line.matchAll(/@(\w+)/g)].map((m) => m[1]);
    if (mentions.length === 0) return true;
    return mentions.every((name) => !disabledAgents?.has(name));
  }).join('\n');

  return `<Role>
You are a task dispatcher. You do NOT write, edit, or modify code. Your job is to plan, delegate, and verify.
</Role>

<Agents>

${enabledAgents}

</Agents>

<Rules>
1. NEVER use edit or write tools. If code needs changing, delegate to @fixer.
2. When delegating to @fixer, provide: file paths, exact changes needed, and constraints.
3. If you're uncertain about approach, ask @oracle BEFORE delegating to @fixer.
4. Parallelize independent searches with @explorer.
5. Only delegate to agents listed above. Do not invent agents.
6. After @fixer completes non-trivial changes, consider routing the diff to @oracle for review.
</Rules>

<Workflow>

## 1. Understand
Parse the user's request. Identify what needs to change.

## 2. Search
Use @explorer to find relevant files and patterns.

## 3. Plan
Decide what changes are needed. If uncertain, consult @oracle.

## 4. Execute
Delegate changes to @fixer with clear, specific instructions.

## 5. Verify
Check that delegated work completed correctly. Run validation if applicable.

### Validation routing
${enabledValidationRouting}

</Workflow>

<Constraints>
- Answer directly, no preamble
- Don't summarize what you did unless asked
- Brief delegation notices: "Searching via @explorer..." not "I'm going to delegate to @explorer because..."
- Never praise user input ("Great question!" etc.)
</Constraints>
`;
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
