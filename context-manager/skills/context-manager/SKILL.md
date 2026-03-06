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
configuration sources, presenting an interactive checklist via AskUserQuestion, and writing
state to `.claude/settings.local.json` — never modifying source definitions.

## Step 1: Detect project root

Run these checks in order, stopping at the first success:

1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, use AskUserQuestion to ask: "Could not detect project root automatically. Please provide the absolute path to your project root."

Once determined, confirm with the user via AskUserQuestion:
"Project root detected: /path/to/project — is this correct?"

If they say no, ask them to provide the correct path. Store as `PROJECT_ROOT`.

## Step 2: Read all configuration sources

Read the following files. Treat missing files as empty (no error).

### Global plugins
Source: `~/.claude/settings.json` → `enabledPlugins` object
Each key is `plugin-name@marketplace`. Value `true` = enabled, `false` = disabled globally.
These are **global** — show them but do not allow toggling.

### Global MCP servers
Source: `~/.claude.json` → top-level `mcpServers` object
Each key is the server name.
These are **global** — show them but do not allow toggling.

### Project MCP servers
Source: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object
Each key is the server name.
These are **project-level** — allow toggling.

### Current toggle state
Source: `$PROJECT_ROOT/.claude/settings.local.json`
Read `disabledMcpjsonServers` array — project MCPs in this list are currently paused.
Read `enabledPlugins` object — any key set to `false` is currently paused at project level.

## Step 3: Print read-only section

Print a static block showing global items (not interactive). Show each global MCP and each
global plugin. For global plugins disabled globally (value `false` in settings.json), show
`[OFF]`; otherwise show `[ON]`:

```
─── Global (read-only) ──────────────────────────────
  [ON]  context7                                   (global MCP)
  [ON]  sequential-thinking                        (global MCP)
  [ON]  memory                                     (global MCP)
  [ON]  tmux-capture@kunal-singh-plugins           (global plugin)
  [OFF] hookify@claude-plugins-official            (global plugin, disabled globally)
  ... etc
─────────────────────────────────────────────────────
```

## Step 4: Present the interactive checklist

Build the list of **toggleable** items:
- Project MCPs from `.mcp.json` (if any) — label as `[MCP] server-name`
- All plugins from `~/.claude/settings.json` `enabledPlugins` that are globally enabled (`true`) — label as `[PLUGIN] plugin-name@marketplace`

Do NOT include globally-disabled plugins (value `false` in global settings.json) — they
cannot be toggled at project level when disabled globally.

Determine current ON/OFF state for each:
- Project MCPs: ON unless in `disabledMcpjsonServers` in `settings.local.json`
- Plugins: ON unless `enabledPlugins[key]` is `false` in `settings.local.json`

Use AskUserQuestion with `multiSelect: true`. Present all toggleable items as options.
Pre-select (as default) all items that are currently ON. The user's selection = what they
want ENABLED. Items not selected = DISABLED (paused).

If there are no toggleable items (no project MCPs and no globally-enabled plugins), print:
```
No toggleable items for this project.
Global MCPs and disabled-globally plugins cannot be toggled here.
```
And stop.

## Step 5: Compute diff and write settings.local.json

File: `$PROJECT_ROOT/.claude/settings.local.json`

**Merge non-destructively:**
1. Read existing file (parse JSON). If missing, start with `{}`.
2. Compute new values for only these two keys:
   - `disabledMcpjsonServers`: array of project MCP names the user did NOT select
   - `enabledPlugins`: object — set `false` for plugins user did NOT select; remove key for plugins user DID select (letting global value take effect)
3. All other keys must remain untouched.
4. Write the merged result back.

Create `$PROJECT_ROOT/.claude/` directory if it does not exist.

Example result:
```json
{
  "disabledMcpjsonServers": ["filesystem"],
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": false
  }
}
```

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
