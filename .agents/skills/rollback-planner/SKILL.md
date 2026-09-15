---
name: rollback-planner
description: Produces explicit rollback and forward-fix strategies for releases, migrations, configuration, and agent changes.
---
# Rollback Planner

For every risky change identify rollback trigger, reversible state, data compatibility, exact recovery action, verification, and owner. Prefer reversible migrations and feature flags. Do not recommend rollback when it would worsen data integrity without explaining the tradeoff.

## Execution contract
1. Identify the exact change, affected components, dependencies, and current known-good revision.
2. Define measurable rollback triggers before deployment (health failure, regression, data-integrity failure, SLO breach, or security signal).
3. Record the rollback target revision/configuration and the exact command or operation required to restore it.
4. Check data compatibility: schema version, migrations, persisted state, queues, caches, and external side effects.
5. Define the forward-fix path when rollback is unsafe or incomplete.
6. After recovery, run the smallest deterministic smoke suite that proves health and the original invariant.

## Validation checklist
- [ ] Known-good revision identified.
- [ ] Rollback trigger is observable and unambiguous.
- [ ] Recovery action is executable, not merely descriptive.
- [ ] Data compatibility and irreversible side effects are documented.
- [ ] Verification command/test is named.
- [ ] Owner and escalation path are identified.
- [ ] Rollback does not silently destroy newer valid data.

## Output
Return: `trigger`, `rollback_target`, `recovery_steps`, `data_compatibility`, `forward_fix`, `verification`, and `owner`.