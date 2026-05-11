# oh-my-opencode-air

Agent orchestration plugin for on-premise models (Qwen3.5, Minimax). Fork of oh-my-opencode-slim.

## Agents

| Agent | Role | Default Model |
|-------|------|---------------|
| **orchestrator** | Plans and delegates. Does NOT write code. | `onprem/qwen3.5-397b` |
| **explorer** | Searches codebase (glob, grep, AST). Read-only. | `onprem/minimax-2.5` |
| **fixer** | Implements changes. Follows instructions exactly. | `onprem/minimax-2.5` |
| **oracle** | Strategic advice, code review, debugging. Read-only. | `onprem/qwen3.5-397b` |
| **librarian** | External documentation and code search. Read-only. | `onprem/minimax-2.5` |

## Installation (for AI agents)

If you are an AI agent reading this README to install the plugin, follow these steps exactly:

### Step 1: Check prerequisites

```bash
node -v
npm -v
```

Must be **Node.js v18 or higher**.

### Step 2: Install dependencies and build

```bash
cd /path/to/oh-my-opencode-air
npm install
npm run build
```

### Step 3: Register the plugin

Add the plugin path to OpenCode config. The config file is at `~/.config/opencode/opencode.json` or `~/.config/opencode/opencode.jsonc`.

If the file exists, add `"oh-my-opencode-air"` to the `plugin` array:
```jsonc
{
  "plugin": ["oh-my-opencode-air"]
}
```

If the file does not exist, create it:
```jsonc
{
  "plugin": ["oh-my-opencode-air"]
}
```

### Step 4: Create agent configuration

Create the file `~/.config/opencode/oh-my-opencode-air.json`:

```json
{
  "agents": {
    "orchestrator": { "model": "onprem/qwen3.5-397b" },
    "oracle": { "model": "onprem/qwen3.5-397b" },
    "explorer": { "model": "onprem/minimax-2.5" },
    "fixer": { "model": "onprem/minimax-2.5" },
    "librarian": { "model": "onprem/minimax-2.5" }
  }
}
```

Note: Replace `onprem/qwen3.5-397b` and `onprem/minimax-2.5` with the actual model identifiers available in your OpenCode provider configuration.

### Step 5: Verify installation

Run OpenCode and test:
```
ping all agents
```

All 5 agents (orchestrator, explorer, fixer, oracle, librarian) should respond.

## Configuration

Edit `~/.config/opencode/oh-my-opencode-air.json` to customize:

```json
{
  "agents": {
    "orchestrator": { "model": "your-provider/qwen3.5-397b", "temperature": 0.1 },
    "oracle": { "model": "your-provider/qwen3.5-397b", "temperature": 0.1 },
    "explorer": { "model": "your-provider/minimax-2.5", "temperature": 0.1 },
    "fixer": { "model": "your-provider/minimax-2.5", "temperature": 0.2 },
    "librarian": { "model": "your-provider/minimax-2.5", "temperature": 0.1 }
  }
}
```

### Internal Code Search MCP

If your company has an internal code search MCP server:

```bash
export DS_SEARCH_URL="http://your-internal-server:8080/mcp"
export DS_SEARCH_API_KEY="your-token"
```

The explorer agent will automatically use it for code search.

## 100-Line Write Constraint

The on-premise server has a strict 100-line-per-tool-call limit. This is enforced automatically by the write-constraint hook. Agents are also instructed in their prompts to chunk edits.

## Skills

| Skill | Description |
|-------|-------------|
| [karpathy-guidelines](src/skills/karpathy-guidelines/SKILL.md) | Coding guidelines to reduce LLM mistakes |
| [codemap](src/skills/codemap/SKILL.md) | Generate codebase maps |
| [simplify](src/skills/simplify/SKILL.md) | Simplify code without changing behavior |

## Development

```bash
bun install          # Install dependencies
bun run build        # Build to dist/
bun run typecheck    # Type check
bun test             # Run tests
bun run check        # Lint + format
```

## Project Structure

```
src/
├── agents/       # Agent factories (orchestrator, explorer, oracle, fixer)
├── cli/          # CLI entry point
├── config/       # Constants, schemas
├── hooks/        # Lifecycle hooks (including write-constraint)
├── mcp/          # MCP servers (websearch, grep_app, ds_search)
├── multiplexer/  # Tmux/Zellij integration
├── skills/       # Skills (codemap, simplify, karpathy-guidelines)
├── tools/        # Tools (webfetch, AST-grep)
└── utils/        # Shared utilities
```

## Philosophy

Based on [Karpathy's coding guidelines](https://x.com/karpathy/status/2015883857489522876):

1. **Think before coding** — State assumptions. Ask if uncertain.
2. **Simplicity first** — Minimum code that solves the problem.
3. **Surgical changes** — Touch only what you must.
4. **Goal-driven execution** — Define success criteria. Loop until verified.
5. **Write constraint** — Chunk edits into ≤100 line segments.

## Troubleshooting

### Tests failing

Some tests depend on the environment. Skip them:
```bash
bun test --test-path-pattern='!interview|dashboard|paths|system|providers|apply-patch|task-session-manager|tmux|auto-update-checker'
```

### tmux not installed
```bash
apt-get install -y tmux
```

### Plugin not loading
Check that the plugin path in `opencode.json` is correct and `bun run build` completed successfully.

## License

MIT
