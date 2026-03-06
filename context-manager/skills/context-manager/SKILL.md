---
name: Context Manager
description: >
  This skill is used when the user invokes the context-manager command to interactively
  toggle plugins for the current project session. Trigger phrases include:
  "manage context", "toggle plugins", "context manager", "manage plugins", "reduce context window".
user-invocable: false
---

# Context Manager Skill

Manages which plugins are active for the current project session. Plugin state is written
to `.claude/settings.local.json`. Source definitions are never modified.

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

If they say no, ask them to provide the correct path. Store as `PROJECT_ROOT`.

## Step 2: Read configuration sources

Read the following files. Treat missing files as empty (no error).

- **Global plugins**: `~/.claude/settings.json` → `enabledPlugins` object. Keys are `plugin@marketplace`, values `true`/`false`.
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

From global `enabledPlugins` and local `settings.local.json` `enabledPlugins`, derive:

**Locally-ON plugins**: globally-OFF plugins with `enabledPlugins[key]: true` in
`settings.local.json`. Currently active for this project.

**Locally-OFF plugins**: globally-OFF plugins without `enabledPlugins[key]: true` in
`settings.local.json`. Currently inactive for this project.

Ask two separate AskUserQuestion calls with `multiSelect: true`:

**Question 1** — only if locally-ON plugins exist:
"Which of these locally-enabled plugins do you want to disable for this project?"
Options: one per locally-ON plugin, labeled `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all enabled" as the last option.

**Question 2** — only if locally-OFF plugins exist:
"Which of these globally-disabled plugins do you want to enable for this project?"
Options: one per locally-OFF plugin, labeled `[PLUGIN] plugin-name@marketplace`.
Always include "None — keep all disabled" as the last option.

Skip a question if its list is empty. If both lists are empty, print:
```
No toggleable plugins for this project.
```
And stop.

## Step 5: Write plugin state → `$PROJECT_ROOT/.claude/settings.local.json`

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

If changes were made:
```
✓ Saved plugin state to .claude/settings.local.json

Run /reload-plugins to apply changes.
```

If nothing changed:
```
No changes made.
```
