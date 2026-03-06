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

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Keys are `plugin@marketplace`, values `true`/`false`.
- **Global MCPs**: `~/.claude.json` → top-level `mcpServers` object. Keys are server names.
- **Project MCPs**: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object. Keys are server names.
- **Current local state**: `$PROJECT_ROOT/.claude/settings.local.json` → `disabledMcpjsonServers` array and `enabledPlugins` object.

## Step 3: Print read-only section (globally-ON plugins)

Plugins that are globally enabled (`true` in global `enabledPlugins`) are already active and
cannot be toggled at project level — show them as read-only above the interactive checklist:

```
─── Active globally (read-only) ─────────────────────
  [ON] plugin-name@marketplace    (plugin)
  ...
─────────────────────────────────────────────────────
```

## Step 4: Present the interactive checklist

Two categories of toggleable items:

### MCPs (all — global + project)
Every MCP server is toggleable. The user can disable any MCP locally for this project.

- Global MCPs (from `~/.claude.json` top-level `mcpServers`): ON unless in `disabledMcpjsonServers` in settings.local.json
- Project MCPs (from `.mcp.json`): ON unless in `disabledMcpjsonServers` in settings.local.json

Label as `[MCP] server-name`.

### Plugins (globally-OFF only)
Only plugins where global value is `false` appear here. They are off globally but can be
enabled locally for this project session.

- If `enabledPlugins[key]` is `true` in settings.local.json → currently ON locally
- Otherwise → currently OFF

Label as `[PLUGIN] plugin-name@marketplace`.

### Presenting
Use AskUserQuestion with `multiSelect: true`. Present all MCPs and globally-OFF plugins.
Pre-select currently-ON items. Selection = ENABLED. Unselected = DISABLED.

If there are no toggleable items, print:
```
No toggleable items for this project.
```
And stop.

## Step 5: Compute diff and write settings.local.json

File: `$PROJECT_ROOT/.claude/settings.local.json`

**Merge non-destructively:**
1. Read existing file (parse JSON). If missing, start with `{}`.
2. Compute new values for only these two keys:
   - `disabledMcpjsonServers`: array of MCP server names (global or project) the user did NOT select
   - `enabledPlugins`: for globally-OFF plugins — set `true` if user selected; remove key if not selected (lets global `false` take effect)
3. All other keys must remain untouched.
4. Write the merged result back.

Create `$PROJECT_ROOT/.claude/` directory if it does not exist.

Example result:
```json
{
  "disabledMcpjsonServers": ["memory", "sequential-thinking"],
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true
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
