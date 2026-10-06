---
name: pwn-request-scanner
description: Detect pull-request workflows that expose secrets or privileged execution to untrusted PR code. Use for security review of GitHub Actions, especially pull_request_target and workflow trust boundaries.
license: MIT
---

# Pwn Request Scanner

Use this skill to audit GitHub Actions for pwn-request risks.

## Procedure
1. Identify workflow triggers, especially `pull_request_target`, `workflow_run`, and privileged `push` paths.
2. Trace checkout behavior and determine whether attacker-controlled PR code is checked out before privileged steps.
3. Inspect token permissions, secrets availability, reusable workflows, scripts, and shell commands.
4. Treat execution of PR-controlled code with write-capable tokens or secrets as a critical trust-boundary violation.
5. Prefer read-only analysis first; do not mutate repository settings or workflows unless explicitly requested.
6. Produce evidence with repository, commit/ref, workflows inspected, findings, severity, and exact remediation.
7. Never claim a clean result without an actual scan or complete inspection.

## Safety
Run scans against disposable or explicitly authorized repositories. Do not execute untrusted PR code merely to test the scanner.
