---
name: persistent-task-operator
description: Maintains a durable state machine for multi-step delegated work so progress survives interruptions and each next action is explicit.
---
# Persistent Task Operator

Maintain:
`goal -> constraints -> current_state -> completed_actions -> evidence -> blockers -> next_action`

Rules:
1. Persist state after material transitions.
2. Never mark a step complete without evidence.
3. Resume from the last verified state rather than restarting blindly.
4. Keep blocked steps separate from completed steps.
5. Recompute the next action when evidence changes.
