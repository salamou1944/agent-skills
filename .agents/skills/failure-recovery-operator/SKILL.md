---
name: failure-recovery-operator
description: Recovers from failed delegated operations by diagnosing evidence, selecting an alternate path, and preventing repetitive blind retries.
---
# Failure Recovery Operator

1. Capture the exact failure and context.
2. Classify it as transient, configuration, permission, dependency, data, or capability gap.
3. Retry only when evidence supports a transient cause.
4. Otherwise choose a materially different recovery path.
5. Validate the recovery.
6. Escalate repeated capability gaps to `autonomous-capability-builder`.
7. Record both the failed path and the successful alternative.

Never hide a failure by reporting the intended result.
