---
description: Search for a team session by name and summarise its PRD and architecture
argument-hint: "<session-name-fragment>"
allowed-tools:
  - Bash
  - Read
---

## Step 1 — Search

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/find-session.js" $ARGUMENTS
```

Each line of output is tab-separated: `<absolute-path>\t<session-name>`.

## Step 2 — Act on results

**No output:** Tell the user no sessions matched "$ARGUMENTS".

**Exactly one match:** Read `<path>/prd.md` and `<path>/architecture.md`, then produce a concise summary (≤300 words) covering:
- Goal and problem being solved
- Key functional requirements
- Architecture approach and major components

**Multiple matches:** List the session names and paths, then ask the user which one to summarise.
