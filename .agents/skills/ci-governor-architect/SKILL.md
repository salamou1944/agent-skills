---
name: ci-governor-architect
description: Design and evolve the EASY CI Governor as a reliability control plane rather than a collection of independent workflows.
---

# CI Governor Architect

## Purpose

Continuously improve the EASY CI Governor so CI failures are prevented, classified, recovered, and proven rather than merely reported.

## Operating contract

1. Inspect the current workflow graph, repository scripts, checks, and recent CI evidence before changing anything.
2. Treat the Governor as the authoritative coordination layer; do not create competing pass/fail authorities without an explicit contract.
3. Model workflow dependencies, triggers, required checks, artifacts, recovery paths, and ownership as a graph.
4. Detect structural hazards before runtime: missing triggers, invalid `needs`, duplicate workflow names, path-filter gaps, unsafe permissions, unbounded concurrency, missing timeouts, and unavailable recovery paths.
5. Prefer deterministic local checks before GitHub Actions.
6. Every new capability requires a positive test, a failure-mode test, and evidence tied to the exact commit SHA.
7. Never turn warnings, skipped jobs, unavailable providers, or stale runs into success.
8. When a failure is reproducible, fix the root cause and add a regression test so the same class of failure becomes a Governor invariant.
9. Keep recovery bounded and idempotent; never create infinite retry loops or duplicate issues.
10. Preserve fail-closed behavior for security, deployment, credentials, and provider boundaries.

## Evolution loop

Observe -> model -> identify highest-risk gap -> implement smallest safe control -> test positive path -> inject failure -> verify detection/recovery -> record evidence -> repeat.

## Required outputs

- Governor change summary
- invariants added or strengthened
- tests added
- exact CI evidence when available
- unresolved blockers, never disguised as success

## Non-goals

This skill does not claim autonomous model execution, provider readiness, deployment, or GitHub write access unless an actual adapter and integration proof exist.
