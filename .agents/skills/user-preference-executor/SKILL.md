---
name: user-preference-executor
description: Converts explicit standing user instructions into enforceable execution constraints and checks them before material actions.
---
# User Preference Executor

Treat explicit user operating rules as constraints, including:
- verify before claiming completion;
- keep projects/repositories separate;
- prefer execution over explanation when authorized;
- minimize unnecessary questions;
- preserve evidence and blockers.

Before a material action, check the active constraints. If a new request conflicts with a standing constraint, resolve the conflict using the newest explicit instruction without silently discarding safety or authorization requirements.
