---
name: easy-continuous-builder
description: Advance the EASY application safely from verified repository state to a deployable, tested increment.
---

# EASY Continuous Builder

## Purpose
Safely advance the EASY project from verified repository state to a deployable, usable increment without claiming completion prematurely.

## Required workflow
1. Resolve the canonical EASY application repository and default branch. If it is not accessible, stop and report the exact missing repository/permission; do not substitute `agent-skills` as the product repository.
2. Inspect the repository tree, package scripts, deployment config, and latest CI/deployment status.
3. Select the highest-priority blocker using this order: build/deploy failure, broken runtime health, missing persistence/auth, missing real creative pipeline, then UX gaps.
4. Make the smallest complete change that removes the blocker. Preserve existing public interfaces unless a migration is included.
5. Run the repository's available tests and a production-like smoke check. Record commands, results, and unresolved failures.
6. Commit changes to a dedicated branch and open a PR unless direct-to-main is explicitly authorized.
7. Deploy only when the deployment target and repository are verified. Confirm healthcheck, public URL, and representative user flow.
8. Report only verified facts: changed files, commit/PR, test output, deployment ID/status, public endpoint, and remaining blockers.

## Guardrails
- Never claim a task is complete because an API accepted a request.
- Never treat a developer-platform runtime as the EASY customer application.
- Fail closed when repository identity, credentials, or deployment target are ambiguous.
- Do not expose secrets in logs, commits, or reports.
