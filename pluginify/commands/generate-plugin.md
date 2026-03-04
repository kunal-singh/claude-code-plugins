---
description: Generate a complete, validated Claude Code plugin from a natural language description. Produces all required files (plugin.json, SKILL.md, commands, hooks, MCP config) following all validator constraints.
---

# /generate-plugin

Converts a natural language description into a production-ready Claude Code plugin with all required files, validated against known constraints.

## Usage

```
/generate-plugin <description>
```

## What to Include in Your Description

The more specific you are, the better the output. Include:

- **What the plugin does** (core purpose)
- **Skills needed** (what knowledge should Claude have?)
- **Commands** (what slash commands should users trigger?)
- **Hooks** (what lifecycle events should automate things?)
- **External integrations** (GitHub, Slack, databases, APIs?)

## Example Prompts

### Simple skill plugin
```
/generate-plugin A plugin with a skill that teaches Claude how to write
idiomatic Go error handling patterns
```

### Skill + command
```
/generate-plugin A security audit plugin with a skill about OWASP Top 10
vulnerabilities and a /audit command that reviews the current file
```

### Full-featured plugin
```
/generate-plugin A code review plugin that:
- Has a skill about security patterns and performance anti-patterns
- Has a /review command for reviewing selected code
- Has a PreToolUse hook that warns before editing files with TODO comments
- Integrates with GitHub API to fetch PR context
```

### MCP-integrated plugin
```
/generate-plugin A plugin that fetches live documentation using context7 MCP
and has a /docs command to look up any library's current API
```

## What Gets Generated

For every plugin, Pluginify generates:

1. `.claude-plugin/plugin.json` — validated manifest with version, skills, commands arrays
2. `skills/<name>/SKILL.md` — skill file with YAML frontmatter and full instructions
3. `commands/<name>.md` — command file for each slash command
4. `hooks/hooks.json` — hook config if lifecycle automation was requested
5. `.mcp.json` — MCP server config if external API integration was requested
6. `.env.example` — required environment variables if secrets are needed
7. `README.md` — installation instructions and usage guide

## Validation Guarantees

Every generated plugin:

- Passes `claude plugin validate ./.claude-plugin/plugin.json`
- Has no `"hooks"` field in `plugin.json` (auto-loaded by convention)
- Uses arrays for all component fields
- Uses explicit file paths for agents (`.../agent.md`)
- Uses `${VAR}` syntax for all secrets in `.mcp.json`
- Uses only valid hook event types
- Has relative, cross-platform paths throughout

## Interaction Flow

1. You provide a description
2. Pluginify may ask one or two clarifying questions if requirements are ambiguous
3. Pluginify generates all files as complete, ready-to-copy content
4. Pluginify confirms which of the 10 gotchas were handled and how
5. You copy files into your plugin directory and run `claude plugin validate`

## After Generation

```bash
# Validate the manifest
claude plugin validate ./.claude-plugin/plugin.json

# Install and test locally
claude --plugin-dir ./my-plugin

# Set required env vars (if MCP servers included)
export API_KEY="your-key-here"
```
