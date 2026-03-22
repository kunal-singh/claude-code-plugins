---
description: >
  Integrates @kunal-singh style-guide configs (ESLint, Prettier, TypeScript, commitlint)
  into a project and sets up lefthook + lint-staged git hooks. Use when asked to "set up style
  guide", "add linting", "integrate configs", "scaffold monorepo", "add kunal-singh configs",
  "set up eslint", "set up prettier", "set up git hooks", or "configure commitlint".
user-invocable: true
argument-hint: "[monorepo|vite|add-package] [react|nextjs|library|server|base]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Style Guide Integration

Integrates `@kunal-singh` style-guide packages into a project. Supports three preset use cases plus flexible custom integration.

## Packages

| npm package | peer deps |
|---|---|
| `@kunal-singh/eslint-config` | `eslint >=9` |
| `@kunal-singh/prettier-config` | `prettier >=3` |
| `@kunal-singh/typescript-config` | `typescript` |
| `@kunal-singh/commitlint-config` | `@commitlint/cli >=19`, `@commitlint/config-conventional >=19` |

ESLint presets: default (base), `/react`, `/nextjs`, `/server`, `/react-app`
TypeScript presets: `/base`, `/react`, `/library`, `/nextjs`, `/server`

## Step 1: Determine Use Case

If an argument was provided (`monorepo`, `vite`, or `add-package`), use it directly.

Otherwise, auto-detect by running:

```bash
ls pnpm-workspace.yaml 2>/dev/null && echo "monorepo-exists" || true
ls vite.config.* 2>/dev/null && echo "vite" || true
```

Decision logic:
- `pnpm-workspace.yaml` exists → existing monorepo → use `add-package` flow (ask for package name)
- `vite.config.*` exists → use `vite` flow
- Neither exists → use `monorepo` flow (fresh scaffold)

## Step 2: Detect Framework Preset

If the user specified a preset type (second argument), use it. Otherwise run:

```bash
node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  const d={...p.dependencies,...p.devDependencies}; \
  if(d['next']) console.log('nextjs'); \
  else if(d['react']) console.log('react'); \
  else if(d['express']||d['fastify']||d['hono']||d['koa']) console.log('server'); \
  else console.log('base');" 2>/dev/null || echo "base"
```

Preset → ESLint import mapping:
- `react` → `@kunal-singh/eslint-config/react`
- `nextjs` → `@kunal-singh/eslint-config/nextjs`
- `server` or `library` → `@kunal-singh/eslint-config/server`
- `base` → `@kunal-singh/eslint-config` (default export)

Use the detected value for both ESLint and TypeScript preset selection below.

## Step 3A: Monorepo — Fresh pnpm Workspaces Scaffold

Run these commands in the project root:

```bash
# 1. Create workspace directories
mkdir -p apps packages

# 2. pnpm workspace manifest
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 3. Root package.json (private monorepo root)
REPO_NAME=$(basename "$PWD")
cat > package.json << EOF
{
  "name": "${REPO_NAME}",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
EOF

# 4. Install all style-guide deps at workspace root
pnpm add -D -w \
  @kunal-singh/eslint-config eslint \
  @kunal-singh/prettier-config prettier \
  @kunal-singh/typescript-config typescript \
  @kunal-singh/commitlint-config @commitlint/cli @commitlint/config-conventional \
  lefthook lint-staged

# 5. Config files — use the detected/specified preset for the ESLint import
# Replace <PRESET_IMPORT> with the correct value from the mapping in Step 2:
#   base    → @kunal-singh/eslint-config
#   server/library → @kunal-singh/eslint-config/server
#   react   → @kunal-singh/eslint-config/react
#   nextjs  → @kunal-singh/eslint-config/nextjs
cat > eslint.config.js << 'EOF'
import config from "<PRESET_IMPORT>";
export default config;
EOF

cat > prettier.config.js << 'EOF'
export { default } from "@kunal-singh/prettier-config";
EOF

cat > commitlint.config.js << 'EOF'
import baseConfig from "@kunal-singh/commitlint-config";
export default { ...baseConfig };
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "@kunal-singh/typescript-config/base",
  "compilerOptions": {
    "composite": true
  },
  "exclude": ["node_modules"]
}
EOF

cat > .lintstagedrc.js << 'EOF'
export default {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"],
};
EOF

# 6. Git hooks (lefthook)
cat > lefthook.yml << 'EOF'
pre-commit:
  commands:
    lint-staged:
      run: pnpm exec lint-staged

commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}
EOF

pnpm exec lefthook install
```

After running, show the user the created structure:
```
.
├── apps/
├── packages/
├── lefthook.yml          # pre-commit: lint-staged, commit-msg: commitlint
├── eslint.config.js
├── prettier.config.js
├── commitlint.config.js
├── tsconfig.json
├── .lintstagedrc.js
├── pnpm-workspace.yaml
└── package.json
```

## Step 3B: Vite — Existing Project

Detect if git is already initialized:
```bash
git rev-parse --git-dir 2>/dev/null && echo "git-exists" || git init
```

Install deps (no `-w` flag since not a workspace):
```bash
pnpm add -D \
  @kunal-singh/eslint-config eslint \
  @kunal-singh/prettier-config prettier \
  @kunal-singh/typescript-config typescript \
  @kunal-singh/commitlint-config @commitlint/cli @commitlint/config-conventional \
  lefthook lint-staged
```

For the ESLint config, use the detected preset per the mapping in Step 2:

```bash
# react:
cat > eslint.config.js << 'EOF'
import config from "@kunal-singh/eslint-config/react";
export default config;
EOF

# nextjs:
cat > eslint.config.js << 'EOF'
import config from "@kunal-singh/eslint-config/nextjs";
export default config;
EOF

# server or library:
cat > eslint.config.js << 'EOF'
import config from "@kunal-singh/eslint-config/server";
export default config;
EOF

# base (fallback):
cat > eslint.config.js << 'EOF'
import config from "@kunal-singh/eslint-config";
export default config;
EOF
```

For TypeScript, check if `tsconfig.json` already exists:
```bash
ls tsconfig.json 2>/dev/null && echo "exists" || echo "missing"
```

- If it **exists**: Read it, then Edit to add `"extends": "@kunal-singh/typescript-config/<preset>"` as the first key (preserving all existing options).
- If it **doesn't exist**: Create it:
  ```bash
  cat > tsconfig.json << 'EOF'
  {
    "extends": "@kunal-singh/typescript-config/react",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src"]
  }
  EOF
  ```
  Replace `react` with the detected preset.

Then create prettier, commitlint configs and set up hooks identically to Step 3A.

Add scripts to `package.json` using the Edit tool (read it first, add `lint` and `format` to the scripts block — no `prepare` script needed with lefthook).

## Step 3C: Add Package — New Package in Existing Monorepo

Ask the user for:
1. Package name (e.g. `ui`, `utils`, `api`)
2. Package type (react/library/server/base — default: library)

Then run:
```bash
PKG_NAME="<name>"
PKG_TYPE="<type>"  # react|library|server|base

mkdir -p "packages/${PKG_NAME}/src"

# Package package.json
SCOPE=$(node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  const scope=p.name.startsWith('@') ? p.name.split('/')[0] : '@'+p.name; \
  console.log(scope);" 2>/dev/null || echo "@repo")

cat > "packages/${PKG_NAME}/package.json" << EOF
{
  "name": "${SCOPE}/${PKG_NAME}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF

# Package tsconfig extends root
cat > "packages/${PKG_NAME}/tsconfig.json" << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF

# Minimal entry point
cat > "packages/${PKG_NAME}/src/index.ts" << 'EOF'
export {};
EOF
```

ESLint and Prettier are already configured at the monorepo root — flat config traversal picks them up automatically. No per-package config files needed.

## Step 4: Verify Setup

After completing any use case, run:

```bash
# Verify lint-staged config is valid
pnpm exec lint-staged --list-different 2>/dev/null || echo "lint-staged config OK"

# Verify commitlint
echo "feat: test" | pnpm exec commitlint && echo "commitlint OK"

# Verify ESLint can parse the config
pnpm exec eslint --print-config eslint.config.js > /dev/null && echo "ESLint config OK"
```

Report results to the user. If any step fails, diagnose from the error message — common issues:
- ESLint peer dep missing → run `pnpm add -D eslint-plugin-react` etc.
- lefthook hooks not firing → run `pnpm exec lefthook install` again
- commitlint config parse error → check that `type: "module"` is set in package.json

## Flexible Use Cases

If the user's request doesn't match a preset (e.g. "set up for my Next.js monorepo app"), adapt:
1. Apply Step 3A for the monorepo root
2. Then apply Step 3C for the Next.js app under `apps/`, using the `nextjs` preset for its tsconfig
3. The root `eslint.config.js` stays as base — Next.js apps can override with a local `eslint.config.js` using the `/nextjs` preset if needed

Always prefer running deterministic bash commands over manually writing files with the Write tool.
