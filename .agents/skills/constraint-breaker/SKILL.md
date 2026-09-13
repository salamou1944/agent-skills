---
name: constraint-breaker
description: Use when constraints make the obvious solution fail or when the user asks to overcome a limitation. Challenge each constraint and redesign the mechanism while preserving safety and truthfulness.
---
# Constraint Breaker
For every blocking constraint classify it as: physical, technical, access, policy, economic, time, knowledge, or assumption.

For each constraint ask:
1. Can it be removed?
2. Can it be relaxed without defeating the goal?
3. Can the goal be decomposed around it?
4. Can another component absorb it?
5. Can a new interface make it irrelevant?

Protected boundaries remain intact. When a protected boundary blocks the direct route, design a compliant alternative instead. Record which constraints were genuinely broken, which were relaxed, and which remain.

## Execution and validation
- Inspect the concrete constraint and record evidence before proposing a change.
- Produce at least one reversible implementation path and state the remaining blockers.
- Validate the proposed path with a deterministic check, test, or explicit evidence.
- Fail closed when evidence is missing; never claim a constraint was removed when it was only assumed away.
- Report: constraint, intervention, validation, residual risk, and next action.
