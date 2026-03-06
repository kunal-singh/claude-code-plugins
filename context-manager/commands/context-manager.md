---
name: context-manager
description: Interactively toggle MCP servers and plugins for the current project session to manage context window usage
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

Help the user manage their active MCP servers and plugins for the current project session.
Follow the steps below exactly.

## Step 1: Detect project root

Run these checks in order, stopping at the first success:
1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, use AskUserQuestion to ask: "Could not detect project root automatically. Please provide the absolute path to your project root."

Once determined, confirm with the user via AskUserQuestion:
"Project root detected: /path/to/project — is this correct?"

If they say no, ask them to provide the correct path. Store as PROJECT_ROOT.

## Step 2: Read all configuration sources

Read the following. Treat missing files as empty.

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Keys are `plugin@marketplace`, values `true`/`false`.
- **Global MCPs**: `~/.claude.json` → top-level `mcpServers` object. Keys are server names.
- **Project MCPs**: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object. Keys are server names.
- **Current local state**: `$PROJECT_ROOT/.claude/settings.local.json` → `disabledMcpjsonServers` array and `enabledPlugins` object.

## Step 3: Print read-only section (globally-ON plugins)

Plugins that are globally enabled (`true` in `~/.claude/settings.json` `enabledPlugins`) are
already active and cannot be toggled here — they appear in the read-only section only.

Print:
```
─── Active globally (read-only) ─────────────────────
  [ON] tmux-capture@kunal-singh-plugins       (plugin)
  [ON] context-manager@kunal-singh-plugins    (plugin)
─────────────────────────────────────────────────────
```
(List only plugins where global value is `true`.)

## Step 4: Present the interactive checklist

Two sets of toggleable items:

### MCPs (global + project)
All MCP servers are toggleable — global MCPs (from `~/.claude.json`) and project MCPs
(from `.mcp.json`). The user can disable any MCP locally for this project session.

Determine current ON/OFF state:
- Global MCPs: ON unless the server name is in `disabledMcpjsonServers` in settings.local.json
- Project MCPs: ON unless the server name is in `disabledMcpjsonServers` in settings.local.json

Label as `[MCP] server-name`.

### Plugins (globally-OFF only)
Only show plugins where the global value is `false` in `~/.claude/settings.json`. These are
off globally but can be enabled locally for this project session.

Determine current ON/OFF state:
- If `enabledPlugins[key]` is `true` in settings.local.json → currently ON locally
- Otherwise → currently OFF (default)

Label as `[PLUGIN] plugin-name@marketplace`.

### Presenting the checklist
Use **AskUserQuestion with multiSelect: true**. Present all MCPs and globally-OFF plugins as
options. Pre-select items that are currently ON. User's selection = ENABLED. Unselected =
DISABLED.

If there are no toggleable items at all, print:
```
No toggleable items for this project.
```
And stop.

## Step 5: Compute diff and write settings.local.json

File: `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (or start with `{}`). Only modify these two keys:

- `disabledMcpjsonServers`: array of MCP server names (global or project) the user did NOT select
- `enabledPlugins`: for globally-OFF plugins — set `true` if user selected them, remove the key if not selected (letting global `false` take effect)

All other keys must remain untouched. Write the merged result back.

Create `$PROJECT_ROOT/.claude/` if it does not exist.

## Step 6: Confirm

If changes were made:
```
✓ Saved to .claude/settings.local.json

Run /reload-plugins to apply changes.
```

If nothing changed:
```
No changes made.
```
