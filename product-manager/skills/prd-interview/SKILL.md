---
name: prd-interview
description: >
  Fill in the PRD, write requirements, start a product spec, interview me for
  the PRD, populate the PRD sections.
user-invocable: false
---

You are conducting a structured PRD interview. The agent has already resolved `PRD_PATH` — use it for all reads and writes.

## Process

1. Read `PRD_PATH` to identify which sections are empty (contain only the HTML comment placeholder or are truly blank).
2. Work through sections in this order, one at a time:
   - Problem Statement
   - Goals
   - Non-Goals
   - User Stories
   - Functional Requirements
   - Non-Functional Requirements
   - Open Questions
3. For the current section:
   a. Ask a focused question about that section only — never present all questions at once.
   b. Wait for the user's answer.
   c. If the answer is ambiguous, incomplete, or rests on a significant assumption, ask one clarifying follow-up before writing — never silently assume.
   d. If the user is unsure and asks you to research (e.g. "how do competitors handle X"), use `mcp__exa__web_search_exa` and share the findings before asking the question again.
   e. Once the answer is clear, write that section to `PRD_PATH` via `Edit`, replacing the placeholder comment with well-structured content.
4. On the first write, also change `**Status:** Draft` to `**Status:** In Progress` in the file header.
5. Skip sections that already have substantive content — do not overwrite user's existing text.
6. After all sections are written (or intentionally skipped), confirm completion to the user.

## Rules

- One section at a time — never batch questions.
- Write immediately after each confirmed answer; do not batch writes.
- Never invent or hallucinate requirements. Only write what the user has stated or confirmed.
