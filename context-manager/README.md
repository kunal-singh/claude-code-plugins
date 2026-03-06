# context-manager

Interactively toggle MCP servers and plugins per project session to manage your context window.

## What it does

- Shows all globally configured MCPs and plugins (read-only)
- Lets you pause/resume project-level MCP servers and any plugin per session
- Writes state to `.claude/settings.local.json` — never modifies your source config
- Changes persist until you toggle again; definitions are never deleted

## Prerequisites

Install [gum](https://github.com/charmbracelet/gum):

```bash
brew install gum
```

## Usage

```
/context-manager
```

Claude will:
1. Detect your project root (via `$CLAUDE_PROJECT_ROOT` or git root)
2. Confirm the detected root with you
3. Show global items (read-only) and an interactive checklist for toggleable items
4. Write your selections to `.claude/settings.local.json`
5. Prompt you to run `/reload-plugins`

## How toggling works

| Item type | How paused | Source preserved |
|-----------|-----------|-----------------|
| Project MCP (`mcp.json`) | Added to `disabledMcpjsonServers` in `settings.local.json` | `.mcp.json` untouched |
| Plugin | Set to `false` in `enabledPlugins` in `settings.local.json` | `~/.claude/settings.json` untouched |
| Global MCP / Plugin | Not toggleable | Always on |

## Files modified

- `$PROJECT_ROOT/.claude/settings.local.json` — only `disabledMcpjsonServers` and `enabledPlugins` keys; all other settings preserved
