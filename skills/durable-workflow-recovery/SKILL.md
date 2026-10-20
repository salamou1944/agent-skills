---
name: durable-workflow-recovery
description: Designs and verifies durable automation workflows with retries, idempotency, checkpoints, recovery, and observable failure states without duplicating the existing orchestration control plane.
---
# Durable Workflow Recovery

## Procedure
1. Define the workflow contract, state transitions, idempotency key, retry policy, and terminal states.
2. Persist the minimum checkpoint needed to resume safely.
3. Make side effects idempotent or attach deterministic deduplication keys.
4. Classify transient, permanent, authorization, dependency, and data failures separately.
5. Retry only eligible transient failures with bounded backoff.
6. Resume from the last verified checkpoint after interruption.
7. Verify that duplicate execution does not duplicate irreversible side effects.
8. Record recovery evidence and cleanup state.

## Integration
Use this Skill as a procedural pattern around the existing Elite/ARMY-14 orchestration and existing workflow infrastructure. Do not introduce a second orchestration control plane merely to obtain retries or persistence.

## Provenance
Extracted from Collection durable-automation research, including Hatchet-style persistence, retry, and idempotency patterns.
