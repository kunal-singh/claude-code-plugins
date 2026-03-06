---
name: Context Manager
description: >
  This skill is used when the user invokes the context-manager command to interactively
  toggle plugins and MCP servers for the current project session. Trigger phrases include:
  "manage context", "toggle plugins", "context manager", "manage plugins", "reduce context window",
  "toggle MCP", "disable MCP".
user-invocable: false
---

# Context Manager Skill

Manages which plugins and MCP servers are active for the current project session. Plugin state
is written to `.claude/settings.local.json`. MCP disabled state is written to `~/.claude.json`.
Source definitions are never modified.

## Step 1: Detect project root

Run these checks in order, stopping at the first success:

1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, use AskUserQuestion to ask: "Could not detect project root automatically. Please provide the absolute path to your project root."

Once determined, confirm with the user via AskUserQuestion:
"Project root detected: /path/to/project — is this correct?"

If they say no, ask them to provide the correct path. Store as `PROJECT_ROOT`.

## Step 2: Read configuration sources

Read the following files. Treat missing files as empty (no error).

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Keys are `plugin@marketplace`, values `true`/`false`.
- **Current plugin state**: `$PROJECT_ROOT/.claude/settings.local.json` → `enabledPlugins` object.
- **Global MCPs**: `~/.claude.json` → top-level `mcpServers` object. Keys are server names.
- **Project MCPs**: `$PROJECT_ROOT/.mcp.json` → `mcpServers` object. Keys are server names.
- **Current MCP disabled state**: `~/.claude.json` → `projects["$PROJECT_ROOT"]` → `disabledMcpServers` array.

Merge global and project MCP names into one list of all known MCP servers.

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

### MCP questions

From the merged MCP server list and `disabledMcpServers`:

**Enabled MCPs**: all known MCP server names NOT in `disabledMcpServers`.
**Disabled MCPs**: all known MCP server names that ARE in `disabledMcpServers`.

**Question A** — only if enabled MCPs exist:
"Which MCP servers do you want to DISABLE for this project?"
Options: one per enabled MCP, labeled `[MCP] server-name`.
Always include "None — keep all enabled" as the last option.

**Question B** — only if disabled MCPs exist:
"Which MCP servers do you want to RE-ENABLE for this project?"
Options: one per disabled MCP, labeled `[MCP] server-name`.
Always include "None — keep all disabled" as the last option.

### Plugin questions

From global `enabledPlugins` and local `settings.local.json` `enabledPlugins`, derive:

**Locally-ON plugins**: globally-OFF plugins with `enabledPlugins[key]: true` in
`settings.local.json`. Currently active for this project.

**Locally-OFF plugins**: globally-OFF plugins without `enabledPlugins[key]: true` in
`settings.local.json`. Currently inactive for this project.

**Question 1** — only if locally-ON plugins exist:
"Which of these locally-enabled plugins do you want to disable for this project?"
Options: one per locally-ON plugin, labeled `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all enabled" as the last option.

**Question 2** — only if locally-OFF plugins exist:
"Which of these globally-disabled plugins do you want to enable for this project?"
Options: one per locally-OFF plugin, labeled `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all disabled" as the last option.

Skip a question if its list is empty. If there are no toggleable items at all, print:
```
No toggleable plugins or MCP servers for this project.
```
And stop.

## Step 5a: Write MCP disabled state → `~/.claude.json`

Compute the new `disabledMcpServers` array:
- Start from current `disabledMcpServers` (or `[]` if absent)
- Add names selected in Question A (to disable)
- Remove names selected in Question B (to re-enable)
- If user selected "None" in a question, make no changes for that group

If the array changed, write it back using Python3. Construct and run this command with the
actual list substituted as a JSON array literal (e.g. `["memory", "sequential-thinking"]`):

```bash
python3 -c "
import json
project_root = 'ACTUAL_PROJECT_ROOT'
disabled = ACTUAL_DISABLED_LIST
claude_path = '$HOME/.claude.json'
with open(claude_path) as f:
    d = json.load(f)
d.setdefault('projects', {}).setdefault(project_root, {})['disabledMcpServers'] = disabled
with open(claude_path, 'w') as f:
    json.dump(d, f, indent=2)
"
```

Replace `ACTUAL_PROJECT_ROOT` with the real path string and `ACTUAL_DISABLED_LIST` with the
real Python list literal before running. Do not use shell variable expansion inside the
python3 -c string.

## Step 5b: Write plugin state → `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (parse JSON). If missing, start with `{}`.
Modify only `enabledPlugins`:
- Plugins selected in Question 1 (to disable): remove their key from `enabledPlugins`
- Plugins selected in Question 2 (to enable): set their key to `true` in `enabledPlugins`
- If user selected "None" in either question, make no changes for that group

Write the merged result back only if changes were made.
All other keys must remain untouched.
Create `$PROJECT_ROOT/.claude/` directory if it does not exist.

Example result in `settings.local.json`:
```json
{
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true
  }
}
```

## Step 6: Confirm

If any changes were made:
```
✓ Saved plugin state to .claude/settings.local.json
✓ Saved MCP state to ~/.claude.json

Plugin changes: run /reload-plugins to apply.
MCP changes: restart Claude Code to take effect.
```

Omit lines that do not apply (e.g. omit the MCP line if no MCP changes were made).

If nothing changed:
```
No changes made.
```
