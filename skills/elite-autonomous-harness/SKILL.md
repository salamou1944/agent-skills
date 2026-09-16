---
name: elite-autonomous-harness
description: Autonomous engineering harness that coordinates inspection, planning, implementation, testing, adversarial review, verification, bounded repair, rollback, and evidence journaling. Use when an agent must own an engineering task end-to-end without converting failures into false success.
license: MIT
metadata:
  author: salamou1944
  version: '2.0.0'
---

# Elite Autonomous Harness v2

Elite is an execution harness, not a prompt. The harness owns the control loop around inference providers and tools.

## Control loop

`inspect -> plan -> implement -> test -> adversarial review -> verify -> checkpoint -> complete`

If a validation stage fails:

`rollback -> classify -> repair plan -> implement -> test -> review -> verify`

Repair is bounded by both step and wall-clock budgets. Exhaustion is a real failure, never a success state.

## Core invariants

- Evidence must be produced at the strongest practical boundary before completion is reported.
- Protected paths and security boundaries are enforced by the execution layer, not merely by prompts.
- Changes are snapshotted before mutation and rolled back after a failed cycle.
- Provider selection/recovery is infrastructure; provider output is untrusted until validated.
- Tests, review, and verification are independent stages.
- Every meaningful transition is journaled with task ID, sequence, timestamp, and failure evidence.
- Context is bounded; the harness must not consume unlimited repository state.
- Tool calls should be least-privilege and specialized; read-only inspection can be parallelized, mutations should remain serialized unless an explicit conflict-free strategy exists.
- No secret, credential, authentication bypass, quota bypass, or protected CI modification is permitted.

## Provider contract

The provider receives structured roles (`planner` or `repair`) and returns a plan containing a summary and file changes. Provider failure is recoverable only through the configured provider ladder. Successful inference is never equivalent to successful engineering.

## Completion states

- `implemented`: mutation completed but verification is not complete.
- `tested`: tests passed but the full verification boundary is incomplete.
- `verified`: implementation, tests, review, and verification all passed.
- `blocked`: an external dependency prevents a required boundary check.
- `failed`: budgets or safety/validation gates prevented completion.

Only `verified` may be treated as end-to-end completion when the policy requires verification.

## Required adversarial checks

Challenge assumptions about malformed input, stale context, protected paths, concurrent mutation, partial failure, retry duplication, provider disagreement, timeout, quota exhaustion, and misleading success output.

## Evidence

A completed run must expose a task ID, changed paths, repair count, phase progression, and verification evidence. A commit or CI result is evidence of repository state; it is not a substitute for behavioral verification.
