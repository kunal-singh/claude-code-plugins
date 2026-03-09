---
description: Create a new team session — scaffolds PRD, architecture, and review files in .claude/team-sessions/
argument-hint: "[session-name]"
allowed-tools:
  - Bash
---

Run the scaffolding script, passing the session name from $ARGUMENTS (may be empty):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/new-session.js" $ARGUMENTS
```

Report the script output verbatim. Do not add commentary.
