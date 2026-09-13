---
name: ci-regression-shield
description: Convert every verified CI incident into a permanent regression guard and prevent recurrence across workflows.
---

# CI Regression Shield

## Purpose

Make recurring CI failures progressively harder to reintroduce.

## Contract

1. Read the incident evidence and identify the exact failure invariant.
2. Search existing workflows and tests for equivalent coverage before adding a new guard.
3. Add the narrowest deterministic regression test or Governor rule that detects the failure.
4. Validate both the healthy path and the intentionally broken path.
5. Ensure the new guard runs for every change that can affect the protected behavior; detect path-filter blind spots.
6. Check that required jobs cannot be silently skipped or made non-blocking.
7. Check that recovery logic cannot loop indefinitely or mask the original failure.
8. Record the incident class and the new invariant in machine-readable evidence when practical.
9. Re-run the complete relevant gate on the exact repaired SHA.
10. Never mark a regression as closed from a stale or unrelated successful run.

## Preferred guard layers

Local deterministic check -> Governor invariant -> focused workflow test -> integration proof -> final gate.

## Output

- protected invariant
- guard location
- positive test result
- negative regression result
- exact SHA evidence
- remaining exposure
