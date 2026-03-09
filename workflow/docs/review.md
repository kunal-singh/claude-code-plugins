# Review Checklist: {{SESSION_NAME}}

**Created:** {{CREATED_AT}}

---

## Code Review

- [ ] Logic is correct — no off-by-one errors, missed branches, or wrong assumptions
- [ ] Error handling conveys what failed, what input caused it, and how to fix it
- [ ] Abstractions match their responsibility — nothing does too much or too little
- [ ] Names are accurate and unambiguous in context
- [ ] Comments explain *why*, not *what*

## Security

- [ ] Trust boundaries are explicit — untrusted input is never used without validation
- [ ] Sensitive data (tokens, PII) is never logged or leaked in error messages

## Architecture Alignment

- [ ] Implementation matches approved architecture.md
- [ ] No undocumented third-party services or data flows introduced

---

<!-- Agents append additional review items below. -->
