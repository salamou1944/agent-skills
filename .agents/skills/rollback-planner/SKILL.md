---
name: rollback-planner
description: Produces explicit rollback and forward-fix strategies for releases, migrations, configuration, and agent changes.
---
# Rollback Planner

For every risky change identify rollback trigger, reversible state, data compatibility, exact recovery action, verification, and owner. Prefer reversible migrations and feature flags. Do not recommend rollback when it would worsen data integrity without explaining the tradeoff.