---
description: Teaches Claude how to generate production-ready Claude Code plugins from natural language descriptions, with full knowledge of all validator gotchas and constraints.
disable-model-invocation: false
---

# Claude Code Plugin Generator

## Overview

This skill teaches Claude to act as Pluginify: a specialized plugin generator that converts plain English descriptions into complete, validated Claude Code plugin structures. When applied, Claude should generate all required files, enforce best practices, and prevent the 10 most common validation failures before they happen.

A Claude Code plugin is a shareable unit of functionality that can include:
- **Skills**: Persistent knowledge/instructions loaded into every session
- **Commands**: User-invocable slash commands (e.g., `/review`)
- **Agents**: Specialized sub-agents with their own instructions
- **Hooks**: Event-driven automations triggered by lifecycle events
- **MCP Servers**: External tool/API integrations

## When to Use This Skill

Apply this skill whenever a user:
- Asks you to "create a plugin" or "generate a plugin"
- Describes functionality they want packaged as a Claude Code plugin
- Wants to automate a workflow via hooks or commands
- Needs a shareable skill bundle for their team
- Asks you to scaffold any Claude Code extension

## Plugin Directory Structure

Always generate this exact structure:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Manifest (required)
├── skills/
│   └── skill-name/
│       └── SKILL.md         # Skill definition
├── commands/
│   └── command-name.md      # Command definition (optional)
├── agents/
│   └── agent-name/
│       └── agent.md         # Agent definition (optional)
├── hooks/
│   └── hooks.json           # Hook configs (optional, auto-loaded)
├── .mcp.json                # MCP servers (optional)
└── README.md
```

## The 10 Critical Gotchas

These are the exact failure modes the Claude Code plugin validator will hit. Know them before generating any plugin.

---

### Gotcha 1: NO "hooks" Field in plugin.json

**What fails:** Adding an explicit `"hooks"` field to plugin.json triggers a "Duplicate hooks file detected" error.

**Why:** Claude Code v2.1+ auto-loads `hooks/hooks.json` by filesystem convention. Declaring it explicitly creates a duplicate.

```json
// WRONG — causes "Duplicate hooks file detected"
{
  "name": "my-plugin",
  "hooks": ["./hooks/hooks.json"]
}

// CORRECT — hooks/hooks.json loads automatically
{
  "name": "my-plugin",
  "version": "1.0.0"
}
```

**Rule:** Generate `hooks/hooks.json` when needed. Never reference it in `plugin.json`.

---

### Gotcha 2: Component Fields MUST Be Arrays

**What fails:** String values or bare directory paths cause "Invalid input" validation errors.

**Why:** The validator schema strictly requires arrays for `agents`, `skills`, and `commands`, even when there is only one item.

```json
// WRONG — all three fail validation
{
  "agents": "./agents/my-agent",
  "skills": "./skills",
  "commands": "commands/cmd.md"
}

// CORRECT
{
  "agents": ["./agents/my-agent/agent.md"],
  "skills": ["./skills/skill-name"],
  "commands": ["./commands/cmd.md"]
}
```

**Rule:** Wrap every component path in an array. No exceptions.

---

### Gotcha 3: Agent Paths Must Point to Files, Not Directories

**What fails:** Directory paths for agents fail the agent validator specifically.

**Why:** The agent validator requires an explicit file reference to read the agent definition. A directory is ambiguous.

```json
// WRONG
{
  "agents": ["./agents/my-agent"]
}

// CORRECT
{
  "agents": ["./agents/my-agent/agent.md"]
}
```

**Rule:** Skills use directory paths. Agents use explicit `agent.md` file paths. This asymmetry is intentional and enforced.

---

### Gotcha 4: "version" Field Is Required

**What fails:** Missing version causes installation to fail with a vague error that doesn't mention the version field.

**Why:** The validator enforces semantic versioning for update tracking and marketplace compatibility.

```json
// WRONG — fails with vague "installation failed" error
{
  "name": "my-plugin",
  "description": "does stuff"
}

// CORRECT
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "does stuff"
}
```

**Rule:** Always include `"version": "X.Y.Z"` in semantic versioning format.

---

### Gotcha 5: Validator Errors Are Vague

**What this means:** When validation fails, the error message is often just "Invalid input" with no indication of which field or file caused the problem.

**Debugging strategy:**
1. Check paths are all relative (not absolute)
2. Confirm all component fields are arrays
3. Verify agent paths end in `/agent.md`
4. Remove `"hooks"` field if present
5. Test with `claude plugin validate ./.claude-plugin/plugin.json`
6. Isolate by removing components one at a time until it passes

**Rule:** Validate locally before distributing. When stuck, binary-search the plugin.json by removing halves until the error disappears.

---

### Gotcha 6: Plugins Cannot Auto-Distribute Rules

**What fails:** Placing files in a `rules/` directory and expecting them to auto-install via plugin installation. They won't load.

**Why:** The Claude Code plugin system does not support automatic rules distribution. This is an upstream limitation.

```bash
# WRONG — rules/ files don't auto-load
my-plugin/rules/typescript.md  # ignored

# CORRECT — document manual installation or provide a script
my-plugin/install.sh           # users run this manually
```

**Rule:** If your plugin depends on project-level rules files, provide an `install.sh` script and document the manual step in README.

---

### Gotcha 7: mcpServers Is an Object, Not an Array

**What fails:** Using array format for MCP server configuration causes a schema validation failure.

**Why:** MCP servers are named instances (a map), not an ordered list. The schema requires object format so servers can be referenced by name.

```json
// WRONG — array format fails
{
  "mcpServers": [
    { "name": "context7", "command": "npx", "args": ["-y", "context7-mcp"] }
  ]
}

// CORRECT — object/map format
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "context7-mcp"]
    }
  }
}
```

**Rule:** MCP server keys are the server name. The value is the server config object.

---

### Gotcha 8: Never Hardcode Secrets in .mcp.json

**What fails (silently):** Hardcoded API keys in `.mcp.json` don't break validation, but they create a critical security vulnerability when the plugin is committed to version control.

**Why:** `.mcp.json` is typically tracked by git. Secrets in it will leak.

```json
// WRONG — leaks API key in git history
{
  "mcpServers": {
    "api": {
      "env": {
        "API_KEY": "sk_live_abc123secretvalue"
      }
    }
  }
}

// CORRECT — uses shell variable expansion
{
  "mcpServers": {
    "api": {
      "env": {
        "API_KEY": "${API_KEY}",
        "DEBUG": "${DEBUG:-false}"
      }
    }
  }
}
```

**Rule:** All sensitive values in `.mcp.json` use `${VAR_NAME}` syntax. Provide a `.env.example` file listing required variables. Add `.env` to `.gitignore`.

---

### Gotcha 9: Hook Event Types Are Strictly Enumerated

**What fails:** Using an event name that isn't in the supported list causes the hook to never fire, with no error message.

**Valid hook event types:**
- `SessionStart` — when the Claude Code session begins
- `UserPromptSubmit` — when the user submits a message
- `PreToolUse` — before a tool executes (can block/modify)
- `PostToolUse` — after a tool executes
- `Stop` — when Claude finishes responding
- `SessionEnd` — when the session ends

```json
// WRONG — "PreCommit" is not a valid event type
{
  "hooks": [
    { "event": "PreCommit", "command": "npm test" }
  ]
}

// CORRECT — use PreToolUse with a Bash tool matcher
{
  "hooks": [
    {
      "event": "PreToolUse",
      "matcher": { "tool": "Bash", "pattern": "git commit" },
      "command": "npm test"
    }
  ]
}
```

**Rule:** Only use the six valid event types. To intercept git operations, use `PreToolUse` with a `Bash` tool matcher.

---

### Gotcha 10: .mcp.json File Location Determines Scope

**What fails:** Putting `.mcp.json` in the wrong location means MCP servers don't load in the expected context.

**Scope rules:**
- `.mcp.json` at **project root** → loads for all users of that project (committed to git)
- `~/.mcp.json` at **user home** → loads for that user in all projects
- `.mcp.json` inside **plugin directory** → loads automatically when the plugin is installed

```
// Plugin-scoped MCP (loads with plugin):
my-plugin/.mcp.json

// Project-scoped MCP (shared via git):
my-project/.mcp.json

// User-scoped MCP (personal, not in git):
~/.mcp.json
```

**Rule:** For plugins that bundle an MCP server, place `.mcp.json` inside the plugin directory. Document any required env vars in the README.

---

## Key Principles

1. Generate the `hooks/hooks.json` file separately; never reference it in `plugin.json`.
2. Every component field in `plugin.json` is an array — no exceptions.
3. `"version"` is required in `plugin.json` — fail fast if missing.
4. Agent paths end in `/agent.md`; skill paths end at the skill directory.
5. `mcpServers` is always an object (named map), never an array.
6. All secrets in `.mcp.json` use `${VAR}` or `${VAR:-default}` syntax.
7. Hook events must be one of the six valid types.
8. Validate paths as relative, unambiguous, and cross-platform.
9. Rules files require manual installation; document this clearly.
10. When validation errors are vague, binary-search the plugin.json.

## Interaction Flow

When a user asks you to generate a plugin:

1. **Clarify if needed**: Ask about hook events, external APIs, number of skills/commands.
2. **Parse the description** into concrete components: skills, commands, agents, hooks, MCP servers.
3. **Generate all files** with proper structure, respecting all 10 gotchas.
4. **Run the validation checklist** mentally before outputting.
5. **Explain what was generated** and how to install/customize it.

## Validation Checklist (Run Before Every Output)

- [ ] `plugin.json` has `"version"` field in `X.Y.Z` format
- [ ] `skills`, `commands`, `agents` fields are arrays
- [ ] Agent paths end in `/agent.md` (not directory)
- [ ] No `"hooks"` field in `plugin.json`
- [ ] `mcpServers` is object format if present
- [ ] No hardcoded secrets in `.mcp.json`
- [ ] All hook event types are from the valid six
- [ ] All paths are relative
- [ ] `SKILL.md` files have YAML frontmatter
- [ ] `README.md` documents required env vars and manual steps

## SKILL.md Template

```markdown
---
description: One-line description of what the skill teaches
disable-model-invocation: false
---

# Skill Name

## Overview
What this skill teaches and why it matters.

## When to Use This Skill
Specific triggers and contexts.

## Key Principles
1. Principle one
2. Principle two

## Examples
### Example 1: Good Pattern
...

### Example 2: Bad Pattern (and why)
...

## Best Practices
- Practice one
- Practice two

## Important Notes
- Edge cases
- Platform-specific behavior
```

## .mcp.json Template

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "${API_KEY}",
        "OPTIONAL_VAR": "${OPTIONAL_VAR:-default-value}"
      }
    }
  }
}
```

## hooks.json Template

```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "matcher": {
        "tool": "Bash",
        "pattern": "git commit"
      },
      "command": "npm test"
    }
  ]
}
```

## Important Notes

- Skills directory paths are passed to `"skills"` array; agent *file* paths to `"agents"` array. This asymmetry is intentional.
- The `disable-model-invocation: false` frontmatter field controls whether the skill can trigger additional model calls. Set to `true` only for purely informational skills where you want zero additional latency.
- When generating cross-platform hooks, prefer `npx` or `python` over shell-specific commands to avoid Windows incompatibility.
- Always generate a `.env.example` alongside `.mcp.json` so users know what environment variables to set.
- The `claude plugin validate` command validates `plugin.json` schema only — it does not validate file contents or hook event types.
