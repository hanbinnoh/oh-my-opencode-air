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

If you have copied or unzipped the source code folder into WSL, you can build it directly using npm:

```bash
cd /path/to/oh-my-opencode-air
npm install
npm run build
```

### Step 3: Register plugin and disable default agents

Add the plugin path to OpenCode config and disable the default agents to prevent conflicts. The config file is at `~/.config/opencode/opencode.json` or `~/.config/opencode/opencode.jsonc`.

If the file exists, update it to include the plugin and disable flags:
```jsonc
{
  "plugin": ["oh-my-opencode-air"],
  "agent": {
    "explore": {
      "disable": true
    },
    "general": {
      "disable": true
    }
  }
}
```

If the file does not exist, create it with the above content.

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

### Step 6: Global Agent Guidelines (Optional)

To apply the baseline coding guidelines to all your projects, copy the `AGENTS.md` file to your global OpenCode configuration directory:

```bash
cp AGENTS.md ~/.config/opencode/AGENTS.md
```

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

## LSP (Language Server Protocol)

LSP tools provide type-aware code navigation and diagnostics. OpenCode auto-detects LSP servers from your PATH.

### Enable LSP

Add to `~/.config/opencode/opencode.json`:

```jsonc
{
  "lsp": true
}
```

Restart OpenCode. The sidebar should show LSP servers instead of "LSPs are disabled".

### Available LSP Tools

| Tool | Agent Access | Description |
|------|-------------|-------------|
| `lsp_diagnostics` | fixer, oracle | Check type errors, lint warnings |
| `lsp_goto_definition` | explorer, oracle | Jump to symbol definition |
| `lsp_find_references` | explorer, oracle | Find all usages of a symbol |
| `lsp_symbols` | explorer, oracle | List symbols in file/workspace |
| `lsp_prepare_rename` | oracle | Check if rename is valid |
| `lsp_rename` | oracle | Rename symbol across workspace |

### Required LSP Servers

Install language servers for your project's languages:

```bash
# TypeScript/JavaScript
npm install -g typescript-language-server typescript

# Python
pip install basedpyright

# Or use biome (already covers TS/JS + more)
npm install -g @biomejs/biome
```

## Hashline Edit

Precise line-anchored editing for dumb models. Each line gets a content hash (`LINE#ID`), preventing stale edit references.

### Enable

Add to `~/.config/opencode/oh-my-opencode-air.json`:

```json
{
  "hashline_edit": true
}
```

### Usage

After enabling, the `read` tool output includes hash tags:

```
<content>
1#AB|import { foo } from './bar'
2#CD|
3#EF|export function hello() {
4#GH|  console.log('world')
5#IJ|}
</content>
```

The `hashline_edit` tool uses these hashes:

```
hashline_edit(
  filePath: "/abs/path/to/file.ts",
  edits: [{
    op: "replace",
    pos: "4#GH",
    lines: ["  return 'world'"]
  }]
)
```

If the file content changes, the hash `GH` won't match line 4 anymore — the edit is rejected, preventing corruption.

## What's New

| Feature | Description |
|---------|-------------|
| **LSP agent access** | fixer can use `lsp_diagnostics`, explorer can use `lsp_find_references`, `lsp_goto_definition`, `lsp_symbols` |
| **edit-error-recovery** | Auto-injects recovery reminder when edit tool fails (oldString not found, etc.) |
| **hashline-edit** | Hash-anchored line editing. Prevents stale reference errors for dumb models |
| **hashline-read-enhancer** | Auto-attaches content hashes to read tool output for hashline-edit |

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
├── hooks/        # Lifecycle hooks (edit-error-recovery, hashline-read-enhancer, etc.)
├── mcp/          # MCP servers (websearch, grep_app, ds_search)
├── multiplexer/  # Tmux/Zellij integration
├── shared/       # Bun runtime shims (hash, file, spawn)
├── skills/       # Skills (codemap, simplify, karpathy-guidelines)
├── tools/        # Tools (webfetch, AST-grep, hashline-edit)
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
