---
name: context-manager
description: Interactively toggle plugins for the current project session to manage context window usage
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

Help the user manage their active plugins for the current project session.
Follow the steps below exactly.

Note: MCP toggling is not supported. Disabled MCPs still inject tool definitions into the
context window (Claude Code bug #11370), so toggling them does not save context tokens.
Use Claude Code's built-in MCP Tool Search (lazy loading) instead.

## Step 1: Detect project root

Run these checks in order, stopping at the first success:
1. `echo $CLAUDE_PROJECT_ROOT` — if set and non-empty, use it
2. `git rev-parse --show-toplevel` — if inside a git repo, use that path
3. If both fail, use AskUserQuestion to ask: "Could not detect project root automatically. Please provide the absolute path to your project root."

Once determined, confirm with the user via AskUserQuestion:
"Project root detected: /path/to/project — is this correct?"

If they say no, ask them to provide the correct path. Store as PROJECT_ROOT.

## Step 2: Read configuration sources

Read the following. Treat missing files as empty.

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Keys are `plugin@marketplace`, values `true`/`false`.
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

From `~/.claude/settings.json` `enabledPlugins` and `$PROJECT_ROOT/.claude/settings.local.json`
`enabledPlugins`, derive two lists:

**Locally-ON plugins**: globally-OFF plugins that have `enabledPlugins[key]: true` in
`settings.local.json`. These are currently active for this project.

**Locally-OFF plugins**: globally-OFF plugins that do NOT have `enabledPlugins[key]: true`
in `settings.local.json`. These are inactive for this project.

Ask two separate AskUserQuestion calls with `multiSelect: true`:

**Question 1** — only if there are locally-ON plugins:
"Which of these locally-enabled plugins do you want to disable for this project?"
Options: one per locally-ON plugin, labeled as `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all enabled" as the last option.

**Question 2** — only if there are locally-OFF plugins:
"Which of these globally-disabled plugins do you want to enable for this project?"
Options: one per locally-OFF plugin, labeled as `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all disabled" as the last option.

Skip a question entirely if its list is empty.

If there are no toggleable plugin items at all, print:
```
No toggleable plugins for this project.
```
And stop.

## Step 5: Write plugin state → `$PROJECT_ROOT/.claude/settings.local.json`

Read existing file (or start with `{}`). Only modify `enabledPlugins`:
- Plugins selected in Question 1 (to disable): remove their key from `enabledPlugins`
- Plugins selected in Question 2 (to enable): set their key to `true` in `enabledPlugins`
- If the user selected "None" in either question, make no changes for that group

All other keys must remain untouched. Write the merged result back only if changes were made.
Create `$PROJECT_ROOT/.claude/` if it does not exist.

## Step 6: Confirm

If changes were made:
```
✓ Saved plugin state to .claude/settings.local.json

Run /reload-plugins to apply changes.
```

If nothing changed:
```
No changes made.
```
