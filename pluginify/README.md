# Pluginify

> **Note**: This plugin was built as a learning exercise to understand Claude Code plugin architecture. For practical use, the official [plugin-dev](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/plugin-dev) plugin from Anthropic provides a more complete and maintained plugin generation experience — use that instead.

AI-powered Claude Code plugin generator. Describe what you want in plain English — Pluginify generates a complete, validated plugin structure with all required files.

## What It Does

Pluginify installs two things into Claude Code:

1. **`plugin-generator` skill** — Gives Claude deep knowledge of Claude Code plugin architecture, all 10 validator gotchas, and the correct file structure for every component type.
2. **`/generate-plugin` command** — Lets you trigger plugin generation directly from Claude Code with a natural language description.

## Requirements

- Claude Code v2.1+

## Installation

```bash
# Clone the repo
git clone https://github.com/kunalsingh/claude-code-plugins.git

# Install the plugin
claude --plugin-dir ./claude-code-plugins/pluginify
```

Or install directly from the plugin marketplace once published.

## How to Use

### Option 1: Use the command

```
/generate-plugin A plugin with a skill about TypeScript async patterns
```

### Option 2: Just describe what you want

With the plugin active, Claude automatically applies the plugin-generator skill. You can say:

```
Create a plugin that:
- Teaches Claude about our internal API conventions (skill)
- Has a /api-review command to audit API endpoints
- Runs a linter hook before any file is saved
```

Pluginify will generate all files and explain what was created.

## Examples

### Simple: One Skill

**Input:**
```
/generate-plugin A plugin with a skill teaching idiomatic Rust error handling
```

**Output:**
```
my-plugin/
├── .claude-plugin/plugin.json
├── skills/rust-errors/SKILL.md
└── README.md
```

### Standard: Skill + Command + Hook

**Input:**
```
/generate-plugin A security audit plugin with a skill about OWASP Top 10,
a /audit command, and a PreToolUse hook that warns before editing auth files
```

**Output:**
```
my-plugin/
├── .claude-plugin/plugin.json
├── skills/security-audit/SKILL.md
├── commands/audit.md
├── hooks/hooks.json
└── README.md
```

### Advanced: With MCP Integration

**Input:**
```
/generate-plugin A plugin that uses the GitHub API to fetch PR context,
has a skill about code review best practices, and a /pr-review command
```

**Output:**
```
my-plugin/
├── .claude-plugin/plugin.json
├── skills/code-review/SKILL.md
├── commands/pr-review.md
├── .mcp.json
├── .env.example
└── README.md
```

## After Generation

```bash
# Validate the generated plugin manifest
claude plugin validate ./.claude-plugin/plugin.json

# Test locally
claude --plugin-dir ./my-plugin

# If MCP servers are included, set required env vars first
cp .env.example .env
# Edit .env with your actual values
source .env
claude --plugin-dir ./my-plugin
```

## The 10 Gotchas Pluginify Prevents

Pluginify automatically handles all known Claude Code plugin validator constraints:

| # | Gotcha | What Pluginify Does |
|---|--------|---------------------|
| 1 | NO `"hooks"` field in plugin.json | Generates `hooks/hooks.json` separately; never adds `"hooks"` to manifest |
| 2 | Component fields must be arrays | Wraps all `skills`, `commands`, `agents` values in arrays |
| 3 | Agent paths need explicit files | Points to `./agents/name/agent.md`, not `./agents/name` |
| 4 | `"version"` field is required | Always includes semantic version (`1.0.0`) |
| 5 | Validator errors are vague | Validates against all constraints before output |
| 6 | Rules can't auto-distribute | Generates `install.sh` and documents manual steps |
| 7 | `mcpServers` is object not array | Uses named-key object format for MCP config |
| 8 | No hardcoded secrets | Uses `${VAR}` expansion in `.mcp.json`; generates `.env.example` |
| 9 | Hook event types are enumerated | Only uses: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SessionEnd` |
| 10 | `.mcp.json` location matters | Places `.mcp.json` in correct scope (plugin/project/user) |

## Plugin Structure Reference

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # Manifest (required)
├── skills/
│   └── skill-name/
│       └── SKILL.md             # Skill definition
├── commands/
│   └── command-name.md          # Slash command
├── agents/
│   └── agent-name/
│       └── agent.md             # Sub-agent (path must be explicit)
├── hooks/
│   └── hooks.json               # Hooks (NOT referenced in plugin.json)
├── .mcp.json                    # MCP server config
├── .env.example                 # Required env vars template
└── README.md
```

## Valid Hook Events

| Event | When It Fires |
|-------|--------------|
| `SessionStart` | Claude Code session begins |
| `UserPromptSubmit` | User submits a message |
| `PreToolUse` | Before a tool executes |
| `PostToolUse` | After a tool executes |
| `Stop` | Claude finishes responding |
| `SessionEnd` | Session ends |

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-improvement`
3. Make your changes
4. Open a PR

## License

MIT
