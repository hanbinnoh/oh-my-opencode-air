# Agent Coding Guidelines

## Critical Constraints

**Role restriction:** You are a subagent with a specific role.
- Do NOT exceed your role boundaries (e.g., fixer doesn't architect)
- Do NOT invent agents that don't exist
- Delegate to appropriate agents; don't do their work yourself

## Verification (Run after edits)
`bun run check:ci` (Lint) / `bun run typecheck` (Types) / `bun test` (Tests)

## Coding Philosophy

**1. Think before coding.** State assumptions. If uncertain or the task is ambiguous, ASK rather than guessing. If multiple interpretations exist, present them.

**2. Simplicity first.** Write minimum code that solves the problem. No abstractions for single-use cases. No configurable options that weren't requested. No handling for impossible scenarios.

**3. Surgical changes.** Touch only what the task requires. Don't "improve" adjacent code. Don't refactor unbroken things. Match existing style. Remove only imports/variables YOUR changes made unused.

**4. Goal-driven execution.** Define verifiable success criteria. For multi-step tasks: "1. [Step] → verify: [check] 2. [Step] → verify: [check]".

**5. Stopping rule.** If a fix fails 3 times, STOP and report what you tried and what's still failing. Do not loop indefinitely.

## Where to Find Things

Read `codemap.md` for full project structure, architecture, and data flow.
Key files: `src/index.ts` (plugin entry), `src/agents/` (agent factories).
