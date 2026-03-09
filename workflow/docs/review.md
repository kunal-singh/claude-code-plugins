# Review Checklist: {{SESSION_NAME}}

**Created:** {{CREATED_AT}}

---

## Code Review

- [ ] Code follows project style guide
- [ ] No dead code or commented-out blocks
- [ ] Functions are ≤100 lines, cyclomatic complexity ≤8
- [ ] No magic numbers — constants are named
- [ ] Error handling is explicit and actionable
- [ ] No swallowed exceptions
- [ ] Tests cover happy path and edge cases
- [ ] Test coverage meets project threshold

## Security Audit

- [ ] No hardcoded secrets or credentials
- [ ] All user input is validated at boundaries
- [ ] SQL queries use parameterised statements
- [ ] No XSS vectors in rendered output
- [ ] Dependencies have no known CVEs
- [ ] Auth/authz enforced on all endpoints
- [ ] Sensitive data is not logged
- [ ] HTTPS enforced for all external calls

## Architecture Alignment

- [ ] Implementation matches approved architecture.md
- [ ] No undocumented third-party services introduced
- [ ] Data model changes are backward-compatible or migrated

## Deployment

- [ ] Environment variables documented in .env.example
- [ ] Migrations are reversible
- [ ] Feature flags set correctly for rollout

---

<!-- Agents append additional review items below. -->
