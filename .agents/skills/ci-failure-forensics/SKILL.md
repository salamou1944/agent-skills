---
name: ci-failure-forensics
description: Diagnose CI failures from exact GitHub evidence and convert recurring root causes into durable Governor controls.
---

# CI Failure Forensics

## Purpose

Turn a failed CI run into an evidence-backed root cause and a permanent reliability improvement.

## Contract

1. Start from the exact workflow run, job, step, commit SHA, branch, and attempt.
2. Collect job summaries and logs; distinguish failure, cancellation, timeout, skip, and infrastructure unavailability.
3. Reproduce locally when the failure is code- or configuration-dependent.
4. Separate symptom, root cause, contributing factors, and unrelated warnings.
5. Classify impact: blocking, flaky, infrastructure, security, dependency, workflow-configuration, or product regression.
6. Fix the smallest root cause that prevents recurrence.
7. Add a regression test or Governor invariant for every recurring failure class.
8. Re-run verification on the repaired SHA; do not reuse evidence from a previous SHA as proof.
9. If evidence is unavailable, return `UNVERIFIED` rather than guessing.
10. Never bypass a failing required check merely to obtain a green status.

## Recovery rules

- bounded retries only
- no retry storm
- no duplicate recovery issues
- preserve original logs and run identifiers
- security and deployment failures remain fail-closed

## Output states

`SOLVED`, `REPAIRING`, `BLOCKED`, `UNVERIFIED`.
