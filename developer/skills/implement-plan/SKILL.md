---
name: implement-plan
description: >
  Implement the plan, execute the implementation tasks, build the feature,
  write the code, start coding, implement task N.
user-invocable: false
---

Implement tasks from the active session's Implementation Plan, one at a time, with explicit user confirmation before starting.

## Phase 1: Read context

1. Read `ARCH_PATH` fully. Extract the `## Implementation Plan` section. If absent, stop and tell the user — the architect needs to produce a plan first.
2. If `PRD_PATH` is non-null, read it for functional context. Do not modify it.
3. Run `Glob` with pattern `**/*` from the project root (two levels deep) to understand the current structure. Filter out `node_modules`, `.git`, and build artifacts.
4. Read any `CLAUDE.md` or `.claude/CLAUDE.md` files present — these are hard constraints for all implementation work.

## Phase 2: Confirm task scope

Present the full Implementation Plan task list to the user as a numbered list:

```
Here are the tasks in the Implementation Plan:

1. <task title> — <brief description>
2. <task title> — <brief description>
...

Which task(s) should I implement? (Enter numbers, a range like 1-3, or 'all')
```

Wait for the user's answer. **Never start implementing without explicit confirmation.**

## Phase 3: Implement task by task

For each selected task, in dependency order:

1. Re-read the task spec from `architecture.md`: target files, functions/types to add or modify, acceptance criterion.
2. Read each target file before editing — never assume its structure.
3. **If anything is unclear or underspecified:**
   a. Ask the user first — one focused question per blocker.
   b. Use `mcp__exa__web_search_exa` or `mcp__context7__get-library-docs` only when the question is about library syntax, API shape, or framework conventions — not about intent or design decisions.
   c. If the user says to escalate to the architect, append to `ARCH_PATH` under the FAQs section:
      ```
      **Q:** <specific question>
      **A:**
      ```
      Then tell the user: "FAQ stub added to `architecture.md`. Invoke the architect agent to answer it before continuing this task."
4. Implement strictly per the task spec:
   - Only create or modify the files listed in the task.
   - Only add or modify the named functions, classes, or types.
   - No scope beyond what the task specifies.
5. Respect all CLAUDE.md constraints:
   - ≤100 lines per function, cyclomatic complexity ≤8, 100-char line limit.
   - No commented-out code. Comment *why*, never *what*.
   - Zero-warning policy — fix every compiler/linter warning.
   - Fail-fast error handling with clear, actionable messages.
   - If a target file doesn't exist, ask the user whether to create it before doing so.
6. After completing each task, confirm:
   ```
   Task N complete — <acceptance criterion met / deviation: explain>.
   ```

## Phase 4: Post-implementation check

After all selected tasks are done:

1. Detect the project's lint/type-check commands:
   - `package.json` → look for `scripts.lint`, `scripts.typecheck`, `scripts.check`
   - `pyproject.toml` → look for configured tools (ruff, mypy, etc.)
2. Run the detected commands via `Bash`. Fix all warnings and errors before reporting done.
3. Report a summary:
   - Tasks completed
   - Any deviations from the plan
   - Follow-up questions or blockers for the architect

## Rules

- **Ask the user before reaching for Exa/Context7.** These tools are for syntax and library docs only — not for design or intent questions.
- Never modify `prd.md`, `architecture.md`, or `review.md` body sections. Only append FAQ stubs (`**Q:**`/`**A:**`) to `architecture.md` when the user explicitly escalates.
- Never implement beyond the task spec. Finish the job; don't invent scope.
- Always read files before editing.
- If a target file doesn't exist, ask before creating it.
