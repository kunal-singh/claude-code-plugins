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

Manages which MCP servers and plugins are active for the current project session. MCP state
is written to `~/.claude.json` (the authoritative source for per-project MCP enable/disable).
Plugin state is written to `.claude/settings.local.json`. Source definitions are never modified.

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
- **Current MCP state**: `~/.claude.json` → `projects["$PROJECT_ROOT"]` → `disabledMcpjsonServers` array. This is the authoritative per-project MCP state. `settings.local.json` is NOT used for MCPs (known Claude Code limitation — it is ignored).
- **Current plugin state**: `$PROJECT_ROOT/.claude/settings.local.json` → `enabledPlugins` object.

## Step 3: Print read-only section (globally-ON plugins)

Plugins globally enabled (`true` in global `enabledPlugins`) are already active and cannot
be toggled at project level — show them as read-only:

```
─── Active globally (read-only) ─────────────────────
  [ON] plugin-name@marketplace    (plugin)
  ...
─────────────────────────────────────────────────────
```

## Step 4: Present the interactive checklist

Two categories of toggleable items:

### MCPs (all — global + project)
Every MCP server is toggleable. Determine ON/OFF state from
`~/.claude.json` → `projects["$PROJECT_ROOT"]` → `disabledMcpjsonServers`:
- OFF if name is in `disabledMcpjsonServers`
- ON otherwise

Label as `[MCP] server-name`.

### Plugins (globally-OFF only)
Only plugins where global value is `false` appear here. They are off globally but can be
enabled locally for this project session. Determine ON/OFF from
`$PROJECT_ROOT/.claude/settings.local.json` → `enabledPlugins`:
- ON if `enabledPlugins[key]` is `true`
- OFF otherwise

Label as `[PLUGIN] plugin-name@marketplace`.

### Presenting
Use AskUserQuestion with `multiSelect: true`. Present all MCPs and globally-OFF plugins.
Pre-select currently-ON items. Selection = ENABLED. Unselected = DISABLED.

If there are no toggleable items, print:
```
No toggleable items for this project.
```
And stop.

## Step 5: Compute diff and write state

### 5a: MCP state → `~/.claude.json`

Read `~/.claude.json` (full file). Find `projects["$PROJECT_ROOT"]`. If the project entry
doesn't exist, create it as `{}`.

Set only `disabledMcpjsonServers` to the array of MCP names the user did NOT select.
All other keys in `~/.claude.json` and in the project entry must remain untouched.
Write the full merged file back to `~/.claude.json`.

### 5b: Plugin state → `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (parse JSON). If missing, start with `{}`.
Modify only `enabledPlugins`:
- Globally-OFF plugins the user selected → set `true`
- Globally-OFF plugins the user did NOT select → remove the key (lets global `false` take effect)

All other keys must remain untouched. Write the merged result back.
Create `$PROJECT_ROOT/.claude/` directory if it does not exist.

Example result in `~/.claude.json` project entry:
```json
{
  "disabledMcpjsonServers": ["memory", "sequential-thinking"],
  ...other existing keys untouched...
}
```

Example result in `settings.local.json`:
```json
{
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true
  }
}
```

## Step 6: Confirm

If changes were made:
```
✓ Saved MCP state to ~/.claude.json
✓ Saved plugin state to .claude/settings.local.json

Run /reload-plugins to apply changes.
```

If nothing changed:
```
No changes made.
```
