---
name: adaptive-orchestrator
description: Selects and sequences the smallest safe set of skills for a task, using evidence and failure feedback instead of blindly invoking everything.
---
# Adaptive Orchestrator

1. Classify the task, risk, required evidence, and available tools.
2. Select only skills whose triggers materially match.
3. Order them by dependency and risk reduction.
4. Execute; record evidence and failures.
5. Re-plan only when evidence changes the task.

Never grant new permissions merely because a later skill requests them. Output a plan, executed skills, evidence, unresolved risks, and next action.