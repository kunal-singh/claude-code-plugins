# claude-code-plugins Project Guidelines

## Plugin Versioning & Marketplace Sync

### Versioning Rule
Whenever you modify any agent, skill, or command in a plugin:
1. Bump the `version` field in the plugin's `.claude-plugin/plugin.json` (follow semver: 1.0.0 → 1.0.1 for fixes, 1.1.0 for features, 2.0.0 for breaking changes)
2. **Immediately** sync the version to `.claude-plugin/marketplace.json` in the matching plugin entry

This must happen in the **same commit**.

### How to Verify
Before committing:
- Check that each modified plugin has its version bumped in `plugin.json`
- Check that `marketplace.json` reflects the same version for that plugin
- Use `git diff` to confirm both files are updated

### Example Workflow
```
1. Edit product-manager/agents/product-manager.md
2. Bump product-manager/.claude-plugin/plugin.json: 1.0.0 → 1.0.1
3. Bump matching entry in .claude-plugin/marketplace.json: 1.0.0 → 1.0.1
4. git add -A && git commit (both files updated in same commit)
```

## Plugins in This Repo

| Plugin | Type | Location |
|--------|------|----------|
| product-manager | agent | `./product-manager/` |
| architect | agent | `./architect/` |
| developer | agent | `./developer/` |
| workflow | skill/command | `./workflow/` |
| context-manager | skill/command | `./context-manager/` |
| pluginify | skill/command | `./pluginify/` |
| tmux-capture | skill/command | `./tmux-capture/` |

## Code Standards

- Agent dispatch logic must be explicit and documented in order
- Skills must not invoke each other unless documented in a parent agent
- All agent/skill prose should reference the `ask-questions-if-underspecified` skill when clarification is needed
- Do not add fields to `plugin.json` that aren't in the official schema (e.g., no `dependencies` field)
