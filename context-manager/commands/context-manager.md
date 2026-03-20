---
name: context-manager
description: Interactively toggle plugins and MCP servers for the current project session to manage context window usage
allowed-tools:
  - Bash
  - Write
  - AskUserQuestion
---

Help the user manage their active plugins and MCP servers for the current project session.
Follow the steps below exactly.

## Steps 1 & 2: Detect project root and read configuration

Run this bash block and read its stdout to derive all state:

```bash
PROJECT_ROOT=$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

GLOBAL_PLUGINS=$(jq -c '.enabledPlugins // {}' ~/.claude/settings.json 2>/dev/null || echo '{}')
LOCAL_PLUGINS=$(jq -c '.enabledPlugins // {}' "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null || echo '{}')
GLOBAL_MCPS=$(jq -r '.mcpServers // {} | keys | join(",")' ~/.claude.json 2>/dev/null || echo '')
PROJECT_MCPS=$(jq -r '.mcpServers // {} | keys | join(",")' "$PROJECT_ROOT/.mcp.json" 2>/dev/null || echo '')
DISABLED_MCPS=$(jq -r --arg p "$PROJECT_ROOT" '.projects[$p].disabledMcpServers // [] | join(",")' ~/.claude.json 2>/dev/null || echo '')

echo "PROJECT_ROOT=$PROJECT_ROOT"
echo "GLOBAL_PLUGINS=$GLOBAL_PLUGINS"
echo "LOCAL_PLUGINS=$LOCAL_PLUGINS"
echo "GLOBAL_MCPS=$GLOBAL_MCPS"
echo "PROJECT_MCPS=$PROJECT_MCPS"
echo "DISABLED_MCPS=$DISABLED_MCPS"
```

Parse the output:
- `PROJECT_ROOT`: the detected project root path
- `GLOBAL_PLUGINS`: JSON object of global `enabledPlugins`
- `LOCAL_PLUGINS`: JSON object of local `enabledPlugins`
- `GLOBAL_MCPS`: comma-separated list of global MCP server names (may be empty)
- `PROJECT_MCPS`: comma-separated list of project MCP server names (may be empty)
- `DISABLED_MCPS`: comma-separated list of currently-disabled MCP server names (may be empty)

Merge `GLOBAL_MCPS` and `PROJECT_MCPS` into one deduplicated list of all known MCP servers.

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

### MCP questions

From the merged MCP server list and `disabledMcpServers`:

**Enabled MCPs**: all known MCP server names NOT in `disabledMcpServers`.
**Disabled MCPs**: all known MCP server names that ARE in `disabledMcpServers`.

**Question A** — only if there are enabled MCPs:
"Which MCP servers do you want to DISABLE for this project?"
Options: one per enabled MCP, labeled `[MCP] server-name`.
Always include "None — keep all enabled" as the last option.

**Question B** — only if there are disabled MCPs:
"Which MCP servers do you want to RE-ENABLE for this project?"
Options: one per disabled MCP, labeled `[MCP] server-name`.
Always include "None — keep all disabled" as the last option.

### Plugin questions

From `~/.claude/settings.json` `enabledPlugins` and `$PROJECT_ROOT/.claude/settings.local.json`
`enabledPlugins`, derive two lists:

**Locally-ON plugins**: globally-OFF plugins that have `enabledPlugins[key]: true` in
`settings.local.json`. These are currently active for this project.

**Locally-OFF plugins**: globally-OFF plugins that do NOT have `enabledPlugins[key]: true`
in `settings.local.json`. These are inactive for this project.

**Question 1** — only if there are locally-ON plugins:
"Which of these locally-enabled plugins do you want to disable for this project?"
Options: one per locally-ON plugin, labeled as `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all enabled" as the last option.

**Question 2** — only if there are locally-OFF plugins:
"Which of these globally-disabled plugins do you want to enable for this project?"
Options: one per locally-OFF plugin, labeled as `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all disabled" as the last option.

Skip a question entirely if its list is empty.

If there are no toggleable items at all (no MCPs, no toggleable plugins), print:
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

Read existing file (or start with `{}`). Only modify `enabledPlugins`:
- Plugins selected in Question 1 (to disable): remove their key from `enabledPlugins`
- Plugins selected in Question 2 (to enable): set their key to `true` in `enabledPlugins`
- If the user selected "None" in either question, make no changes for that group

All other keys must remain untouched. Write the merged result back only if changes were made.
Create `$PROJECT_ROOT/.claude/` if it does not exist.

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
