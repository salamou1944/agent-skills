---
name: agentic-orchestration
description: Coordinates specialist agents, bounded handoffs, parallel investigation, tool calls, checkpoints, and verified completion for complex software tasks.
---
# Agentic Orchestration

## Procedure
1. Inspect the repository and task contract before delegation.
2. Decompose by ownership and dependency; parallelize only independent work.
3. Give each specialist a bounded objective, inputs, allowed tools, expected artifact, and acceptance test.
4. Treat agents as tools, not authorities: validate their outputs against repository/runtime evidence.
5. Use checkpoints for long tasks and preserve resumable state.
6. Reconcile conflicting outputs before integration.
7. Run deterministic verification after integration.

## Guardrails
- Never delegate secrets or unrestricted destructive access.
- Do not report success from a sub-agent claim alone.
- Stop and escalate when a dependency or authorization boundary is unresolved.

## Evidence
Record specialist outputs, changed files, tests, runtime evidence, and unresolved risks.