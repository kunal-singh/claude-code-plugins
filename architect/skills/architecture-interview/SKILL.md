---
name: architecture-interview
description: >
  Design the system, fill in the architecture, create implementation plan,
  populate architecture sections, start architecture doc.
user-invocable: false
---

You are conducting a structured architecture interview. The agent has already resolved `ARCH_PATH`, `PRD_PATH`, `REVIEW_PATH`, and `SESSION_ROOT` — use them for all reads and writes.

## Phase 1: Gather context — do not write anything yet

1. If `PRD_PATH` is non-null, read it fully.
2. Use `Glob` to discover the project directory structure (start from the project root, two levels deep).
3. Read all `CLAUDE.md` and `.claude/CLAUDE.md` files found — these encode hard constraints you must carry into the plan.
4. Read key entry-point files (e.g. `package.json`, `pyproject.toml`, `main.*`, `index.*`) to understand existing patterns and tech stack.

## Phase 2: Surface all ambiguities before writing

After gathering context, identify every requirement that is unclear, conflicting, or missing. Present them as a **numbered list** and wait for the user to resolve **all of them** before proceeding. Do not produce any architecture or plan with unresolved items.

- If `prd.md` is absent, rely on the user's conversational context. If not enough context exists, ask targeted questions until fully clear.
- If `prd.md` exists but has gaps that block decisions, ask the user. On confirmation, append the resolved answer to `prd.md`'s FAQs section as:
  ```
  **Q:** <question>
  **A:** <answer>
  ```
  Use `Edit` to append — never modify PRD body sections.

## Phase 3: Interactive section-by-section design

Work through `architecture.md` sections one at a time in this order:

1. System Overview (HLD)
2. Component Diagram (ASCII)
3. Data Flow
4. Technology Decisions
5. LLD per component
6. Infrastructure
7. Security Considerations

For each section:

a. Present what you know from the gathered context; ask **one focused question** about that section.
b. Wait for the user's answer.
c. If the user is unsure, use `mcp__exa__web_search_exa` to research options; present findings; re-ask.
d. If the answer remains ambiguous after one follow-up, block and ask again — never silently assume.
e. Once confirmed, write the section immediately via `Edit`, replacing the HTML comment placeholder with substantive content.
f. Skip sections that already have substantive content — do not overwrite existing work.

On the first write to `architecture.md`, also change `**Status:** Draft` → `**Status:** In Progress`.

## Phase 4: Implementation Plan

After all sections are filled, append a `## Implementation Plan` section to `architecture.md` via `Edit`:

- List tasks in **dependency order** — what must be done before what.
- For each task:
  - Target file path(s)
  - Functions/classes/types to add or modify (names only, no bodies)
  - Acceptance criterion (how to know the task is done)
- Explicitly call out every constraint found in CLAUDE.md files (line limits, naming conventions, zero-warning policy, complexity limits, etc.).
- Must be actionable for a junior developer with no additional context beyond this document.

## Rules

- Never batch questions — one section at a time, one question per turn.
- Write immediately after each confirmed answer; never batch writes.
- Never invent or hallucinate design decisions. Only write what the user has stated or confirmed.
- Never modify source code files.
