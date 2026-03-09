# claude-code-plugins

Personal Claude Code plugin collection by Kunal Singh.

## Add as a marketplace

Run inside a Claude Code session:

```
/plugin marketplace add kunal-singh/claude-code-plugins
```

## Available plugins

### tmux-capture

Capture tmux pane output to ~/tmux-logs/ so Claude can read and analyze output from another pane. See [tmux-capture/README.md](./tmux-capture/README.md).

### pluginify

AI-powered Claude Code plugin generator. Converts natural language descriptions into production-ready, validated plugin structures. See [pluginify/README.md](./pluginify/README.md).

### context-manager

Interactively toggle plugins and MCP servers per project session to manage context window usage. See [context-manager/README.md](./context-manager/README.md).

### workflow

Team session scaffolding — creates structured PRD, architecture, and review checklist files with a searchable JSON index. See [workflow/README.md](./workflow/README.md).

### product-manager

Product manager agent — interviews users to populate session PRDs and answers inter-agent review questions. See [product-manager/README.md](./product-manager/README.md).

### architect

Architect agent — designs HLD/LLD from PRD + codebase, produces junior-ready implementation plans, answers developer FAQs, and reviews implementations. See [architect/README.md](./architect/README.md).

### developer

Developer agent — implements architecture plans task by task, follows CLAUDE.md constraints, escalates blockers to the architect via FAQs. See [developer/README.md](./developer/README.md).
