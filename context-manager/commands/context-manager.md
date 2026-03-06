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

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Global — show but do not allow toggling.
- **Global MCPs**: `~/.claude.json` → top-level `mcpServers` object. Global — show but do not allow toggling.
- **Project MCPs**: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object. Toggleable.
- **Current state**: `$PROJECT_ROOT/.claude/settings.local.json` → `disabledMcpjsonServers` array and `enabledPlugins` object.

## Step 3: Print read-only section

Print a static block showing global items (not interactive). Show `[ON]` or `[OFF]` based
on their value in global settings:

```
─── Global (read-only) ──────────────────────────────
  [ON]  <global-mcp-name>                        (global MCP)
  ...
  [ON]  <plugin@marketplace>                     (global plugin)
  [OFF] <plugin@marketplace>                     (global plugin, disabled globally)
  ...
─────────────────────────────────────────────────────
```

## Step 4: Present the interactive checklist

Build toggleable items:
- Project MCPs from `.mcp.json` → label as `[MCP] server-name`
- Globally-enabled plugins (value `true` in global settings.json) → label as `[PLUGIN] plugin-name@marketplace`

Do NOT include globally-disabled plugins — they cannot be toggled at project level.

For each item, determine current state:
- Project MCPs: ON unless in `disabledMcpjsonServers` in settings.local.json
- Plugins: ON unless `enabledPlugins[key]` is `false` in settings.local.json

Use **AskUserQuestion with multiSelect: true**. Present all toggleable items as options,
pre-selecting currently-ON items. User's selection = ENABLED. Unselected = DISABLED (paused).

If there are no toggleable items, print:
```
No toggleable items for this project.
```
And stop.

## Step 5: Compute diff and write settings.local.json

File: `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (or start with `{}`). Only modify these two keys:
- `disabledMcpjsonServers`: array of project MCP server names the user did NOT select
- `enabledPlugins`: object with `false` for deselected plugins; remove key for selected plugins

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
