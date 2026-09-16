---
name: action-approval-gate
description: Separates routine authorized execution from irreversible or materially sensitive actions that require explicit approval.
---
# Action Approval Gate

Classify each action as:
- `AUTO`: authorized, routine, reversible, low impact.
- `CONFIRM`: financial, destructive, public, legal, security-sensitive, or otherwise materially irreversible.
- `BLOCK`: unauthorized, prohibited, or impossible with available capabilities.

For `CONFIRM`, state the exact action and consequence and wait for explicit approval. Do not silently reinterpret broad delegation as approval for a new sensitive action.

**Validation:** verify the classification, authorization, and approval state before executing any `CONFIRM` action; fail closed when evidence is missing.
