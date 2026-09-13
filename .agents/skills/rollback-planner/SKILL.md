---
name: rollback-planner
description: Produces explicit rollback and forward-fix strategies for releases, migrations, configuration, and agent changes.
---
# Rollback Planner

For every risky change identify rollback trigger, reversible state, data compatibility, exact recovery action, verification, and owner. Prefer reversible migrations and feature flags. Do not recommend rollback when it would worsen data integrity without explaining the tradeoff.

## Operational contract

- **Must:** define the rollback trigger, last known-good state, recovery action, compatibility check, and owner before recommending rollback.
- **Steps:** inspect the change; identify affected state and dependencies; define rollback and forward-fix paths; verify data compatibility; state the exact recovery command or action; assign ownership.
- **Validation:** verify the recovery path in a safe environment when possible, confirm the system returns to the expected invariant, and record evidence.
- **Failure:** if rollback is unsafe, incomplete, or unverified, fail closed and provide a forward-fix or containment plan instead of claiming recovery is safe.
