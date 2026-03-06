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
- **Current MCP state**: `~/.claude.json` → `projects["$PROJECT_ROOT"]` → `disabledMcpjsonServers` array. This is the authoritative source for per-project MCP disable state.
- **Current plugin state**: `$PROJECT_ROOT/.claude/settings.local.json` → `enabledPlugins` object.

## Step 3: Print read-only section (globally-ON plugins)

Plugins that are globally enabled (`true` in `~/.claude/settings.json` `enabledPlugins`) are
already active and cannot be toggled here — show them as read-only:

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
All MCP servers are toggleable. The user can disable any MCP for this project session.

Determine current ON/OFF state from `~/.claude.json` → `projects["$PROJECT_ROOT"]` →
`disabledMcpjsonServers` array:
- MCP is OFF if its name is in `disabledMcpjsonServers`
- MCP is ON otherwise

Label as `[MCP] server-name`.

### Plugins (globally-OFF only)
Only show plugins where the global value is `false` in `~/.claude/settings.json`. These are
off globally but can be enabled locally for this project.

Determine current ON/OFF state from `$PROJECT_ROOT/.claude/settings.local.json` →
`enabledPlugins`:
- If `enabledPlugins[key]` is `true` → currently ON locally
- Otherwise → currently OFF

Label as `[PLUGIN] plugin-name@marketplace`.

### Presenting the checklist
Use **AskUserQuestion with multiSelect: true**. Present all MCPs and globally-OFF plugins.
Pre-select currently-ON items. User's selection = ENABLED. Unselected = DISABLED.

If there are no toggleable items at all, print:
```
No toggleable items for this project.
```
And stop.

## Step 5: Compute diff and write state

Two separate writes:

### 5a: Write MCP state → `~/.claude.json`

Read `~/.claude.json`. Find or create `projects["$PROJECT_ROOT"]` object.
Set `disabledMcpjsonServers` to the array of MCP server names the user did NOT select.
All other keys in `~/.claude.json` and in the project entry must remain untouched.
Write the merged result back to `~/.claude.json`.

### 5b: Write plugin state → `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (or start with `{}`). Only modify `enabledPlugins`:
- For globally-OFF plugins the user selected: set `true`
- For globally-OFF plugins the user did NOT select: remove the key (lets global `false` take effect)

All other keys must remain untouched. Write the merged result back.
Create `$PROJECT_ROOT/.claude/` if it does not exist.

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
