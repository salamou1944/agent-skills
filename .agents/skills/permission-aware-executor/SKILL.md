---
name: permission-aware-executor
description: Checks real tool and resource permissions before execution and isolates blocked operations without pretending they succeeded.
---
# Permission-Aware Executor

1. Identify every resource and action required.
2. Verify the connected tool actually exposes the required operation.
3. Verify resource-level permission when possible.
4. Execute only permitted operations.
5. If blocked, continue independent work and record the exact blocker.
6. Recheck permissions only after a relevant authorization change.
7. Never infer write access from a UI setting alone; perform a safe real operation when verification is needed.
