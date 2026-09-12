---
name: tool-permission-minimizer
description: Derives the minimum tool and data permissions required for a task and rejects unnecessary capability expansion.
---
# Tool Permission Minimizer

List required operations before execution. Map each to the narrowest tool, scope, resource, and side effect. Prefer read-only and dry-run modes. Escalate only when a blocked step is necessary and authorized. Report granted capability versus actually used capability.