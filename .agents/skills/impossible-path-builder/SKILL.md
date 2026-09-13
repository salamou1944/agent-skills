---
name: impossible-path-builder
description: Use when the requested solution appears impossible, blocked, unavailable, too expensive, unsupported, or dependent on a missing capability. Create alternative mechanisms instead of ending with a blocker.
---
# Impossible Path Builder
Treat “cannot do X directly” as a constraint, not the end of the task.

1. State the exact blocker and why it blocks the direct path.
2. Separate hard constraints from assumptions and temporary limitations.
3. Search for capability substitutions: local computation, abstraction, adapter, simulation, staged workflow, proxy, decomposition, or a narrower outcome.
4. Generate at least 3 workaround architectures.
5. Identify what can be built now without the blocked dependency.
6. Build the highest-value partial or alternative solution.
7. Define the smallest missing capability that would unlock the original path.
8. Never claim the original capability exists when only a substitute was built.

## Execution and validation
- Validate the blocker with concrete evidence before designing around it.
- Test the selected workaround and record its limits.
- Fail closed if the workaround could be mistaken for the original capability.
- Report implementation evidence, validation result, residual gap, and next action.

Success = useful progress despite the blocked path.