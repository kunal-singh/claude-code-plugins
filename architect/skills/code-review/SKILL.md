---
name: code-review
description: >
  Do a code review, review the implementation, architect review, check the
  implementation against the architecture.
user-invocable: false
---

You are performing an architect code review. The agent has already resolved `ARCH_PATH`, `REVIEW_PATH`, and `SESSION_ROOT`.

## Process

1. Read `ARCH_PATH` fully — pay particular attention to the `## Implementation Plan` section and any constraints listed from CLAUDE.md.
2. Read `REVIEW_PATH` to understand the existing review checklist and any prior review entries.
3. Ask the user: "Which files or directories should I review?" — wait for the answer before proceeding.
4. For each file identified by the user:
   a. Read it using `Read`.
   b. Use `Glob` if a directory was specified to enumerate files, then read each.
   c. Check against the Implementation Plan:
      - Are the right files modified?
      - Are the right functions/classes/types added or changed?
      - Does the implementation satisfy the stated acceptance criterion?
   d. Check against CLAUDE.md constraints: line length limits, cyclomatic complexity, naming conventions, zero-warning policy, no commented-out code, etc.
   e. Note any deviations, missing edge-case handling, or security issues (untrusted input without validation, sensitive data in logs, etc.).
5. Produce a structured review report with these sections:
   - **Conforms**: what matches the plan and constraints (be specific).
   - **Deviations**: what doesn't match — cite `file:line` references.
   - **Issues**: bugs, security gaps, constraint violations — cite `file:line` references.
   - **Suggested fixes**: concrete and actionable, with line references.
6. Append the review summary to `REVIEW_PATH` below the existing checklist via `Edit`:
   ```
   **Q:** Architect review — <ISO date>
   **A:** <structured summary>
   ```

## Rules

- Never modify source code files — review and append to `review.md` only.
- Never fabricate findings. Only report what you can confirm from the files read.
- If a file cannot be read (missing, permission error), note it in Deviations.
