# style-guide

Claude Code plugin that integrates [`@kunal-singh`](https://github.com/kunal-singh/style-guide) style-guide configs into any project — ESLint, Prettier, TypeScript, and commitlint — plus lefthook + lint-staged git hooks.

## What It Does

Single slash command `/style-guide:integrate` with three presets:

| Preset | Use case |
|--------|----------|
| `monorepo` | Scaffold a fresh pnpm workspaces monorepo |
| `vite` | Add configs to an existing Vite/TypeScript project |
| `add-package` | Add a new package to an existing monorepo |

Auto-detects the use case if no argument is given.

## Packages Installed

- `@kunal-singh/eslint-config` — ESLint v9 flat config (presets: base, react, nextjs, server)
- `@kunal-singh/prettier-config` — Prettier config
- `@kunal-singh/typescript-config` — TypeScript config (presets: base, react, library, nextjs, server)
- `@kunal-singh/commitlint-config` — Conventional commits enforcement

## Git Hooks

Sets up lefthook with:
- `pre-commit` → lint-staged (eslint --fix + prettier --write on staged files)
- `commit-msg` → commitlint (validates commit message format)

## Installation

```bash
# From claude-code-plugins repo root
cc --plugin-dir ./style-guide
```

Or add to your project's `.claude/settings.json`:
```json
{
  "plugins": ["./path/to/style-guide"]
}
```

## Usage

```
/style-guide:integrate
/style-guide:integrate monorepo
/style-guide:integrate vite react
/style-guide:integrate add-package
```

All deterministic steps run as bash commands. The skill auto-detects framework (React, Next.js, etc.) from `package.json` dependencies to select the right ESLint and TypeScript presets.
