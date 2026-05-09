# Agent Coding Guidelines

## Critical Constraints

**Write tool limit:** The on-premise server has a strict 100-line-per-call limit.
- ALWAYS chunk edit/write into ≤100 line segments
- NEVER write/edit more than 100 lines in a single call
- Split larger changes across multiple sequential calls
- Violating this causes an unrecoverable session error

**Role restriction:** You are a subagent with a specific role.
- Do NOT exceed your role boundaries (e.g., fixer doesn't architect)
- Do NOT invent agents that don't exist
- Delegate to appropriate agents; don't do their work yourself

**Bash tool restriction:** The write constraint hook only monitors edit/write tools.
- NEVER use the `bash` tool for file modifications (cat, echo >, sed -i, redirects, etc.)
- Using bash to bypass the write limit will crash the on-premise server
- Always use edit/write tools, chunked to ≤100 lines

## Commands

| Command | Purpose |
|---------|---------|
| `bun run build` | Compile TypeScript |
| `bun run typecheck` | Type check (no emit) |
| `bun test` | Run all tests |
| `bun run check:ci` | Lint + format check |

## Verification Loop (Follow Every Change)

1. Run `bun run check:ci` — fix any lint/format errors
2. Run `bun run typecheck` — fix any type errors
3. Run `bun test` — fix any failing tests
4. Commit only after all three pass

## Coding Philosophy

**1. Think before coding.** State assumptions. If uncertain or the task is ambiguous, ASK rather than guessing. If multiple interpretations exist, present them.

**2. Simplicity first.** Write minimum code that solves the problem. No abstractions for single-use cases. No configurable options that weren't requested. No handling for impossible scenarios.

**3. Surgical changes.** Touch only what the task requires. Don't "improve" adjacent code. Don't refactor unbroken things. Match existing style. Remove only imports/variables YOUR changes made unused.

**4. Goal-driven execution.** Define verifiable success criteria. For multi-step tasks: "1. [Step] → verify: [check] 2. [Step] → verify: [check]".

**5. Stopping rule.** If a fix fails 3 times, STOP and report what you tried and what's still failing. Do not loop indefinitely.

## Where to Find Things

Read `codemap.md` for full project structure, architecture, and data flow.
Key files: `src/index.ts` (plugin entry), `src/agents/` (agent factories).
