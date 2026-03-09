# workflow

Team session scaffolding plugin for Claude Code. Creates structured PRD, architecture, and review files for each dev session, tracked in a searchable JSON index.

## Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/workflow:new-session` | `[session-name]` | Scaffold a new session with PRD, architecture, and review files |
| `/workflow:list-sessions` | — | List all sessions sorted newest-first |
| `/workflow:find-session` | `<fragment>` | Search sessions by name and summarise the match |

## Installation

```bash
claude --plugin-dir /path/to/workflow
```

Or copy into `.claude-plugin/` for project-scoped installation.

## What gets created

Running `/workflow:new-session My Feature` produces:

```
.claude/
└── team-sessions/
    ├── .index.json          ← session registry
    └── my-feature/
        ├── prd.md           ← PRD skeleton
        ├── architecture.md  ← HLD + LLD skeleton
        └── review.md        ← code review + security checklist
```

Session name is slugified for the folder name. Duplicate slugs get `-2`, `-3` suffixes.

If no name is provided, the folder is named `session-YYYYMMDD-HHmmss`.

## Customising templates

Edit files in `docs/` to change the skeleton structure. Two placeholders are replaced at session creation time:

- `{{SESSION_NAME}}` — the human-readable session name
- `{{CREATED_AT}}` — ISO 8601 creation timestamp

No code changes needed.

## Requirements

Node.js ≥ 16 (stdlib only — no npm install required).
