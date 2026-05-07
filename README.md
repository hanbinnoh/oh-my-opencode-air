# oh-my-opencode-air

Agent orchestration plugin for **on-premise dumb models** (Qwen3.5, Minimax). Fork of [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim), optimized for role-restricted operation with limited-capability LLMs.

## What's This?

oh-my-opencode-air routes coding tasks to specialized agents instead of forcing one model to do everything. Designed for on-premise environments where only basic models (Qwen3.5 397B, Minimax 2.5) are available.

**Key differences from oh-my-opencode-slim:**
- 4 agents instead of 8 (orchestrator, explorer, fixer, oracle)
- Simplified prompts for limited-capability models
- 100-line write constraint to prevent server infinite loop errors
- Karpathy coding guidelines built-in
- No external MCP dependencies (no context7, grep_app, websearch)

## Agents

| Agent | Role | Default Model |
|-------|------|---------------|
| **orchestrator** | Plans and delegates. Does NOT write code. | `onprem/qwen3.5-397b` |
| **explorer** | Searches codebase (glob, grep, AST). Read-only. | `onprem/minimax-2.5` |
| **fixer** | Implements changes. Follows instructions exactly. | `onprem/minimax-2.5` |
| **oracle** | Strategic advice, code review, debugging. Read-only. | `onprem/qwen3.5-397b` |

## Installation

```bash
bunx oh-my-opencode-air@latest install
```

Or add manually to your `opencode.json`:

```json
{
  "plugin": ["oh-my-opencode-air"]
}
```

## Configuration

Create or edit `~/.config/opencode/oh-my-opencode-air.json`:

```json
{
  "agents": {
    "orchestrator": { "model": "your-provider/qwen3.5-397b" },
    "oracle": { "model": "your-provider/qwen3.5-397b" },
    "explorer": { "model": "your-provider/minimax-2.5" },
    "fixer": { "model": "your-provider/minimax-2.5" }
  }
}
```

### Model Assignment Strategy

- **orchestrator + oracle** → Your strongest model (Qwen3.5 397B). These need reasoning.
- **explorer + fixer** → Your faster model (Minimax 2.5). These follow instructions.

## 100-Line Write Constraint

The on-premise server has a bug: writing more than 100 lines in a single tool call causes an infinite loop. This is enforced at two levels:

1. **Prompt level** — fixer's prompt includes a `CRITICAL SERVER CONSTRAINT` block
2. **Hook level** — `src/hooks/write-constraint/` rejects oversized writes before they reach the server

## Skills

Built-in skills:

| Skill | Description |
|-------|-------------|
| [codemap](src/skills/codemap/SKILL.md) | Generate hierarchical codemaps for codebase understanding |
| [simplify](src/skills/simplify/SKILL.md) | Simplify code for clarity without changing behavior |
| [karpathy-guidelines](src/skills/karpathy-guidelines/SKILL.md) | Behavioral guidelines to reduce LLM coding mistakes |

Load a skill with the `skill` tool: `skill(name="karpathy-guidelines")`

## Development

```bash
bun install
bun run build        # Build to dist/
bun run typecheck    # Type check
bun test             # Run tests
bun run check        # Lint + format with Biome
bun run dev          # Build and run with OpenCode
```

## Project Structure

```
oh-my-opencode-air/
├── src/
│   ├── agents/       # Agent factories (orchestrator, explorer, oracle, fixer)
│   ├── cli/          # CLI entry point
│   ├── config/       # Constants, schemas
│   ├── hooks/        # OpenCode lifecycle hooks (including write-constraint)
│   ├── mcp/          # MCP server definitions
│   ├── multiplexer/  # Tmux/Zellij pane integration
│   ├── skills/       # Skill definitions
│   ├── tools/        # Tool definitions (webfetch, AST-grep)
│   └── utils/        # Shared utilities
├── .opencode/        # Default config preset
├── biome.json        # Biome configuration
├── tsconfig.json     # TypeScript configuration
└── package.json
```

## Philosophy

This fork follows [Karpathy's coding guidelines](https://x.com/karpathy/status/2015883857489522876):

1. **Think Before Coding** — State assumptions. Don't hide confusion.
2. **Simplicity First** — Minimum code that solves the problem.
3. **Surgical Changes** — Touch only what you must.
4. **Goal-Driven Execution** — Define success criteria. Loop until verified.
5. **Write Constraint** — Always chunk edits into ≤100 line segments.

## License

MIT
