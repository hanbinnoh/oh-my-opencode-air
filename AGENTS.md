# Agent Coding Guidelines

This document provides guidelines for AI agents operating in this repository.

## Project Overview

**oh-my-opencode-air** - Agent orchestration plugin for on-premise dumb models (Qwen3.5, Minimax). Fork of oh-my-opencode-slim, optimized for role-restricted operation with limited-capability LLMs. Built with TypeScript, Bun, and Biome.

## Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build TypeScript to `dist/` (both index.ts and cli/index.ts) |
| `bun run typecheck` | Run TypeScript type checking without emitting |
| `bun test` | Run all tests with Bun |
| `bun run lint` | Run Biome linter on entire codebase |
| `bun run format` | Format entire codebase with Biome |
| `bun run check` | Run Biome check with auto-fix (lint + format + organize imports) |
| `bun run check:ci` | Run Biome check without auto-fix (CI mode) |
| `bun run dev` | Build and run with OpenCode |

**Running a single test:** Use Bun's test filtering with the `-t` flag:
```bash
bun test -t "test-name-pattern"
```

## Code Style

### General Rules
- **Formatter/Linter:** Biome (configured in `biome.json`)
- **Line width:** 80 characters
- **Indentation:** 2 spaces
- **Line endings:** LF (Unix)
- **Quotes:** Single quotes in JavaScript/TypeScript
- **Trailing commas:** Always enabled

### TypeScript Guidelines
- **Strict mode:** Enabled in `tsconfig.json`
- **No explicit `any`:** Generates a linter warning (disabled for test files)
- **Module resolution:** `bundler` strategy
- **Declarations:** Generate `.d.ts` files in `dist/`

### Imports
- Biome auto-organizes imports on save (`organizeImports: "on"`)
- Let the formatter handle import sorting
- Use path aliases defined in TypeScript configuration if present

### Naming Conventions
- **Variables/functions:** camelCase
- **Classes/interfaces:** PascalCase
- **Constants:** SCREAMING_SNAKE_CASE
- **Files:** kebab-case for most, PascalCase for React components

### Error Handling
- Use typed errors with descriptive messages
- Let errors propagate appropriately rather than catching silently
- Use Zod for runtime validation (already a dependency)

### Git Integration
- Biome integrates with git (VCS enabled)
- Commits should pass `bun run check:ci` before pushing

## Project Structure

```
oh-my-opencode-air/
├── src/
│   ├── agents/       # Agent factories (orchestrator, explorer, oracle, fixer)
│   ├── cli/          # CLI entry point
│   ├── config/       # Constants, schemas, MCP defaults
│   ├── hooks/        # OpenCode lifecycle hooks (including write-constraint)
│   ├── mcp/          # MCP server definitions
│   ├── multiplexer/  # Tmux/Zellij pane integration for child sessions
│   ├── skills/       # Skill definitions (codemap, simplify, karpathy-guidelines)
│   ├── tools/        # Tool definitions (webfetch, AST-grep, etc.)
│   └── utils/        # Shared utilities (tmux, session helpers)
├── dist/             # Built JavaScript and declarations
├── docs/             # User-facing documentation
├── biome.json        # Biome configuration
├── tsconfig.json     # TypeScript configuration
└── package.json      # Project manifest and scripts
```

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@opencode-ai/sdk` - OpenCode AI SDK
- `zod` - Runtime validation

## Development Workflow

1. Make code changes
2. Update docs when behavior, commands, configuration, workflows, or user-facing output changes
   - Check `README.md` plus relevant files in `docs/`
   - Keep examples, command snippets, and feature lists in sync with the code
   - If no doc update is needed, explicitly confirm that in your final summary
3. Run `bun run check:ci` to verify linting and formatting
4. Run `bun run typecheck` to verify types
5. Run `bun test` to verify tests pass
6. Commit changes

## Tmux Session Lifecycle Management

When working with tmux integration, understanding the session lifecycle is crucial for preventing orphaned processes and ghost panes.

### Session Lifecycle Flow

```
Task Launch:
  session.create() → tmux pane spawned → task runs

Task Completes Normally:
  session.status (idle) → extract results → session.abort()
  → session.deleted event → tmux pane closed

Task Cancelled:
  cancel() → session.abort() → session.deleted event
  → tmux pane closed

Session Deleted Externally:
  session.deleted event → task cleanup → tmux pane closed
```

### Key Implementation Details

**1. Graceful Shutdown (src/utils/tmux.ts)**
```typescript
// Always send Ctrl+C before killing pane
spawn([tmux, "send-keys", "-t", paneId, "C-c"])
await delay(250)
spawn([tmux, "kill-pane", "-t", paneId])
```

**2. Session Abort Timing (src/council/council-manager.ts)**
- Call `session.abort()` AFTER extracting task results
- This ensures content is preserved before session termination
- Triggers `session.deleted` event for cleanup

**3. Event Handlers (src/index.ts)**
The multiplexer session handler must stay wired up:
- `multiplexerSessionManager.onSessionDeleted()` - closes tmux/zellij panes

### Testing Tmux Integration

After making changes to session management:

```bash
# 1. Build the plugin
bun run build

# 2. Run from local fork (in ~/.config/opencode/opencode.jsonc):
# "plugin": ["file:///path/to/oh-my-opencode-air"]

# 3. Launch test tasks
@explorer count files in src/
@oracle review the orchestrator prompt

# 4. Verify no orphans
ps aux | grep "opencode attach" | grep -v grep
# Should return 0 processes after tasks complete
```

### Common Issues

**Ghost panes remaining open:**
- Check that `session.abort()` is called after result extraction
- Verify `session.deleted` handler is wired in src/index.ts

**Orphaned opencode attach processes:**
- Ensure graceful shutdown sends Ctrl+C before kill-pane
- Check that tmux pane closes before process termination

## Pre-Push Code Review

Before pushing changes to the repository, always run a code review to catch issues like:
- Duplicate code
- Redundant function calls
- Race conditions
- Logic errors

### Using `/review` Command (Recommended)

OpenCode has a built-in `/review` command that automatically performs comprehensive code reviews:

```bash
# Review uncommitted changes (default)
/review

# Review specific commit
/review <commit-hash>

# Review branch comparison
/review <branch-name>

# Review PR
/review <pr-url-or-number>
```

**Why use `/review` instead of asking @oracle manually?**
- Standardized review process with consistent focus areas (bugs, structure, performance)
- Automatically handles git operations (diff, status, etc.)
- Context-aware: reads full files and convention files (AGENTS.md, etc.)
- Delegates to specialized @build subagent with proper permissions
- Provides actionable, matter-of-fact feedback

### Workflow Before Pushing

1. **Make your changes**
   ```bash
   # ... edit files ...
   ```

2. **Stage changes**
   ```bash
   git add .
   ```

3. **Run code review**
   ```
   /review
   ```

4. **Address any issues found**

5. **Run checks**
   ```bash
   bun run check:ci
   bun test
   ```

6. **Commit and push**
   ```bash
   git commit -m "..."
   git push origin <branch>
   ```

**Note:** The `/review` command found issues in our PR #127 (duplicate code, redundant abort calls) that neither linter nor tests caught. Always use it before pushing!

## Coding Philosophy (Karpathy Guidelines)

These guidelines reduce common LLM coding mistakes. They apply to ALL agents in this system.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 5. Write Constraint (Server Limit)

**The on-premise server has a strict 100-line-per-tool-call limit.**

- ALWAYS chunk edit/write operations into ≤100 line segments
- NEVER write or edit more than 100 lines in a single tool call
- If a change spans more than 100 lines, split into multiple sequential calls
- This is enforced by the write-constraint hook, but agents should self-regulate

## Common Patterns

- This is an OpenCode plugin - most functionality lives in `src/`
- The CLI entry point is `src/cli/index.ts`
- The main plugin export is `src/index.ts`
- Agent factories are in `src/agents/` — each agent has its own file + optional `.test.ts`
- Skills are located in `src/skills/` (included in package publish)
- Multiplexer session management is in `src/multiplexer/`
- Tmux utilities are in `src/utils/tmux.ts`
- Write constraint hook (100-line limit) is in `src/hooks/write-constraint/`

## Repository Map

A full codemap is available at `codemap.md` in the project root.

Before working on any task, read `codemap.md` to understand:
- Project architecture and entry points
- Directory responsibilities and design patterns
- Data flow and integration points between modules

For deep work on a specific folder, also read that folder's `codemap.md`.
