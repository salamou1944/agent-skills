---
name: agentic-orchestration
description: Coordinates specialist agents, bounded context-aware handoffs, parallel investigation, checkpoints, tool calls, and verified completion for complex software tasks.
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

## Context-aware handoffs

A handoff should transfer the minimum durable context needed to continue safely:
- current objective and scope;
- decisions already made and constraints that remain binding;
- relevant artifacts, files, evidence IDs, and unresolved blockers;
- next action and its acceptance test.

Prefer durable artifacts over copied conversation transcripts. Avoid maintaining two competing sources of truth for progress. When the task changes materially, re-scope the receiver instead of forcing the old handoff schema onto the new objective.

Validate handoff reliability with a receiver-side continuation test: the receiving agent should be able to identify the current goal, constraints, available evidence, and next verified action without reconstructing the entire prior conversation.

## Guardrails
- Never delegate secrets or unrestricted destructive access.
- Do not report success from a sub-agent claim alone.
- Stop and escalate when a dependency or authorization boundary is unresolved.
- Do not treat a handoff document as proof that the transferred state is correct; verify against durable artifacts.

## Evidence

Record specialist outputs, changed files, tests, runtime evidence, handoff inputs, receiver-side continuation result, and unresolved risks.
