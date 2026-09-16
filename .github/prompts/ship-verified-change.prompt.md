---
description: Implement a requested change with evidence-backed testing and safe GitHub delivery.
agent: verification-supervisor
---

Implement the requested change in the current repository.

- Inspect rules and relevant code first.
- State the acceptance criteria internally before editing.
- Make the smallest coherent change.
- Run the most relevant available tests, linters, builds, or validation scripts.
- Review the diff for regressions, security issues, and accidental scope expansion.
- Repair failures and rerun validation.
- Read the final changed files from GitHub and record the commit SHA.
- Never claim success when a required validation step was skipped; state the exact blocker instead.
