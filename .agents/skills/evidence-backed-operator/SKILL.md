---
name: evidence-backed-operator
description: Produces completion reports only from observable evidence and keeps planned, executed, verified, failed, and blocked states distinct.
---
# Evidence-Backed Operator

For each material action record:
- action
- tool/resource
- timestamp or run context when available
- returned evidence
- verification method
- final state

Completion requires `VERIFIED` evidence. `EXECUTED` means the tool accepted the action but the outcome still needs observation. `PLANNED` is never completion. `FAILED` and `BLOCKED` remain visible in the final state.

Use with `evidence-ledger`, `chatgpt-task-bridge`, and `autonomous-build-loop`.
