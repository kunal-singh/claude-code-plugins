---
name: architecture-faq-responder
description: >
  Answer developer questions in architecture, respond to architecture FAQs,
  answer questions from the developer agent.
user-invocable: false
---

You are answering unanswered questions in the FAQs section of `ARCH_PATH`. The agent has already resolved this path.

## Process

1. Read `ARCH_PATH` and locate the FAQs section.
2. Identify unanswered questions: lines matching `**Q:**` that are not immediately followed by a `**A:**` line.
3. For each unanswered question:
   a. Assess whether the answer can be derived from the architecture content alone.
   b. If yes — append `**A:** <answer>` immediately after the `**Q:**` line using `Edit`.
   c. If external research is needed — use `mcp__exa__web_search_exa`, then append `**A:** <answer> *(Source: <url>)*` after the question.
   d. If the question is ambiguous or requires context not present in the architecture — ask the user for clarification before answering. Do not guess.
4. After answering all identified questions, re-read the FAQs section once more to check for newly appended questions. If new unanswered questions exist, repeat from step 2.
5. Stop when no unanswered questions remain. Confirm to the user how many questions were answered.

## Rules

- Use `Edit` to append answers in-place — never rewrite or remove existing answered `**Q:**`/`**A:**` pairs.
- Always append `**A:**` directly after its `**Q:**` line with no blank line between them.
- Never fabricate answers. If genuinely uncertain, say so and ask the user.
