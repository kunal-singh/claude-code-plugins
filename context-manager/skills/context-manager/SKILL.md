---
name: Context Manager
description: >
  This skill is used when the user invokes the context-manager command to interactively
  toggle MCP servers and plugins for the current project session. Trigger phrases include:
  "manage context", "toggle plugins", "disable mcp", "enable mcp", "context manager",
  "toggle mcp servers", "manage plugins", "reduce context window".
user-invocable: false
---

# Context Manager Skill

Manages which MCP servers and plugins are active for the current project session by reading
configuration sources, presenting an interactive gum checklist, and writing state to
`.claude/settings.local.json` — never modifying source definitions.

## Step 1: Check gum is installed

Run `which gum`. If not found, output:

```
gum is required but not installed.
Install it with: brew install gum
Then re-run this command.
```

And stop.

## Step 2: Detect project root

Run these checks in order, stopping at the first success:

1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, ask the user: "Could not detect project root automatically. Please provide the absolute path to your project root:"

Once determined, confirm with the user:
```
Project root detected: /path/to/project
Is this correct? (y/n)
```

If they say no, ask them to provide the correct path.

Store as `PROJECT_ROOT`.

## Step 3: Read all configuration sources

Read the following files. Treat missing files as empty (no error).

### Global plugins
Source: `~/.claude/settings.json` → `enabledPlugins` object
Each key is `plugin-name@marketplace`. Value `true` = enabled, `false` = disabled.
These are **global** — show them but do not allow toggling.

### Global MCP servers
Source: `~/.claude.json` → top-level `mcpServers` object
Each key is the server name. Always present.
These are **global** — show them but do not allow toggling.

### Project MCP servers
Source: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object
Each key is the server name.
These are **project-level** — allow toggling.

### Current toggle state
Source: `$PROJECT_ROOT/.claude/settings.local.json`
Read `disabledMcpjsonServers` array — project MCPs in this list are currently paused.
Read `enabledPlugins` object — any key set to `false` is currently paused.

## Step 4: Build and run the gum UI

### Read-only section (print before gum runs)

Print a static header for global items that cannot be toggled:

```
─── Global (read-only) ──────────────────────────────
  [ON] context7              (global MCP)
  [ON] sequential-thinking   (global MCP)
  [ON] memory                (global MCP)
  [ON] hookify@claude-plugins-official      (global plugin)
  [ON] plugin-dev@claude-plugins-official   (global plugin)
  ... etc
─────────────────────────────────────────────────────

Use SPACE to toggle, ENTER to confirm, ESC to cancel.
```

### Interactive section (gum checklist)

Build the list of toggleable items — project MCPs + all plugins that are not global-only.

For each item, determine if it is currently ON (not in disabled list) or OFF (in disabled list / set to false).

Run the toggle script via Bash using the portable plugin root path:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" "<comma-separated-currently-on-items>" "[MCP] server1" "[PLUGIN] plugin@marketplace" ...
```

The script calls `gum choose --no-limit` with `--selected` pre-set to currently-ON items.

Format each item label as:
- Project MCPs: `[MCP] server-name`
- Plugins (toggleable): `[PLUGIN] plugin-name@marketplace`

Capture the output — the selected lines are the items the user wants ENABLED.
Items not in the output should be DISABLED (paused).

## Step 5: Compute the diff

Compare user selection against current state to determine:
- Project MCPs not selected → add to `disabledMcpjsonServers`
- Project MCPs selected → remove from `disabledMcpjsonServers`
- Plugins not selected → set `enabledPlugins["key"]: false`
- Plugins selected → remove the key (or set to `true`) from `enabledPlugins`

## Step 6: Write to settings.local.json

File location: `$PROJECT_ROOT/.claude/settings.local.json`

**Critical: merge non-destructively.**

1. Read existing file if it exists (parse JSON). If it doesn't exist, start with `{}`.
2. Only modify `disabledMcpjsonServers` and `enabledPlugins` keys.
3. All other keys (permissions, env, etc.) must remain untouched.
4. Write the merged result back.

Example result:
```json
{
  "disabledMcpjsonServers": ["filesystem"],
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": false
  }
}
```

Create `$PROJECT_ROOT/.claude/` directory if it doesn't exist.

## Step 7: Confirm and prompt reload

Print:
```
✓ Saved to .claude/settings.local.json

Changes will take effect after reloading plugins.
Run /reload-plugins to apply now.
```

If nothing changed from the current state, print:
```
No changes made.
```
