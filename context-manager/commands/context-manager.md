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

## Step 1: Check gum is installed

Run `which gum`. If not found, output:
```
gum is required but not installed.
Install it with: brew install gum
Then re-run /context-manager.
```
And stop.

## Step 2: Detect project root

Run these checks in order, stopping at the first success:
1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, use AskUserQuestion to ask: "Could not detect project root automatically. Please provide the absolute path to your project root."

Once determined, confirm with the user via AskUserQuestion:
"Project root detected: /path/to/project — is this correct?"

If they say no, ask them to provide the correct path. Store as PROJECT_ROOT.

## Step 3: Read all configuration sources

Read the following. Treat missing files as empty.

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Global — show but do not allow toggling.
- **Global MCPs**: `~/.claude.json` → top-level `mcpServers` object. Global — show but do not allow toggling.
- **Project MCPs**: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object. Toggleable.
- **Current state**: `$PROJECT_ROOT/.claude/settings.local.json` → `disabledMcpjsonServers` array and `enabledPlugins` object.

## Step 4: Print read-only section

Print a static block showing global items (not interactive):

```
─── Global (read-only) ──────────────────────────────
  [ON] <global-mcp-name>    (global MCP)
  ...
  [ON] <plugin@marketplace>  (global plugin)
  ...
─────────────────────────────────────────────────────
Use SPACE to toggle, ENTER to confirm, ESC to cancel.
```

## Step 5: Run the gum checklist

Build a list of toggleable items:
- Project MCPs: label as `[MCP] server-name`
- All plugins: label as `[PLUGIN] plugin-name@marketplace`

Determine which items are currently ON (not in disabled list / not set to false).

Run the toggle script using Bash:
```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" "<comma-separated-currently-on-items>" "[MCP] server1" "[PLUGIN] plugin@marketplace" ...
```

Capture output — selected lines = user wants ENABLED. Unselected = DISABLED (paused).

## Step 6: Compute diff and write settings.local.json

File: `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (or start with `{}`). Only modify these two keys:
- `disabledMcpjsonServers`: array of project MCP server names the user deselected
- `enabledPlugins`: object with `false` for deselected plugins, remove key for selected ones

All other keys must remain untouched. Write the merged result back.

Create `$PROJECT_ROOT/.claude/` if it does not exist.

## Step 7: Confirm

If changes were made:
```
✓ Saved to .claude/settings.local.json

Run /reload-plugins to apply changes.
```

If nothing changed:
```
No changes made.
```
