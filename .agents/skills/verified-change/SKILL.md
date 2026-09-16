---
name: verified-change
description: Drive a change from inspection through implementation, testing, adversarial review, repair, and evidence-backed completion.
---

# Verified Change

Turn a request into a small, testable, evidence-backed change.

## Loop
1. Inspect current state and applicable rules.
2. Define acceptance criteria in observable terms.
3. Implement the smallest safe change.
4. Run the most relevant available tests, linters, builds, or CI checks.
5. Review the diff for regressions, security issues, unintended scope, and missing tests.
6. Repair failures instead of repeating the same approach.
7. Read changed files back from GitHub.
8. Report commit, validation, result, and remaining blockers.

## Completion gate
Do not say "done" based only on a successful write. A write proves persistence, not correctness. If execution validation is unavailable, state that limitation explicitly.

## Guardrails
- No secrets in source, logs, prompts, fixtures, or commits.
- No bypass of auth, MFA, CAPTCHA, quotas, rate limits, or platform controls.
- No destructive or materially sensitive setting changes without explicit authorization.
