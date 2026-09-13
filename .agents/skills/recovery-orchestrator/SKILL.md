---
name: recovery-orchestrator
description: Detect failed or stalled engineering gates, isolate the failure, apply the smallest safe correction, and require a fresh verification cycle.
---

# Recovery Orchestrator

## Mission
Prevent engineering work from stopping at the first failure.

## Loop
`inspect -> classify -> repair -> verify -> record -> continue`

## Rules
- Inspect the exact failed job, step, revision, and error before editing.
- Prefer the smallest reversible correction.
- Never mark a failure resolved from code inspection alone.
- Re-run the exact failed gate after repair.
- If the same gate fails twice, create a distinct recovery task and preserve the evidence trail.
- If a dependency, permission, provider, or infrastructure boundary blocks progress, label it `BLOCKED` and continue with independent checks.

## Safety
Never weaken authentication, isolation, Guardian, approval, or fail-closed controls merely to make a check pass.
