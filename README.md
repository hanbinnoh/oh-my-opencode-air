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

## Troubleshooting: Test Failures

Some tests depend on the runtime environment. Here's how to resolve common failures in on-premise deployments.

### tmux Not Installed (3 failures)

Symptom: `TmuxMultiplexer` tests fail with `no path in output`.

```bash
# Ubuntu/Debian
apt-get install -y tmux

# RHEL/CentOS
yum install -y tmux
```

tmux is required for the multiplexer feature (watching agents work in real-time panes). If you don't need it, set `"multiplexer": { "type": "none" }` in your config.

### OpenCode SDK Not Installed (11 failures)

Symptom: `paths`, `system/paths`, `providers` tests fail with missing `~/.opencode/bin`.

These tests verify OpenCode CLI integration. Install OpenCode:

```bash
curl -fsSL https://opencode.ai/install | bash
```

Or skip them if you only use the plugin programmatically:

```bash
bun test --test-path-pattern='!paths|system|providers'
```

### WSL Path/Permission Issues (7 failures)

Symptom: `apply-patch` tests fail with permission mode mismatches (`0o750` vs `438`), or path separator issues (`/` vs `\`).

These only occur in WSL (Windows Subsystem for Linux). On native Linux servers, they pass. If running in WSL:

```bash
# Option 1: Run tests with permission fix
sudo mount -o remount,metadata /

# Option 2: Skip WSL-specific tests
bun test --test-path-pattern='!apply-patch|task-session-manager'
```

### Dashboard/Interview Integration (27 failures)

Symptom: `dashboard`, `interview service`, `interview manager` tests fail with missing runtime infrastructure.

These require a full OpenCode session (HTTP server, file watchers). They pass in CI with a proper OpenCode installation. For local development:

```bash
# Skip integration tests
bun test --test-path-pattern='!interview|dashboard'
```

### Running Only Unit Tests

To run only the tests that should pass in any environment:

```bash
bun test --test-path-pattern='!interview|dashboard|paths|system|providers|apply-patch|task-session-manager|tmux|auto-update-checker'
```

### Environment Checklist for On-Premise Deployment

| Requirement | Required For | Install |
|-------------|-------------|---------|
| tmux ≥ 3.0 | Multiplexer (agent panes) | `apt-get install tmux` |
| OpenCode CLI | Full plugin functionality | `curl -fsSL https://opencode.ai/install \| bash` |
| Bun ≥ 1.3 | Build & test | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js ≥ 18 | Biome linter (optional) | `apt-get install nodejs` |

## License

MIT
