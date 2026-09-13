# EASY Developer Platform

EASY Developer Platform is the control plane for EASY Group. It is designed as a provider-neutral developer environment rather than a copy of Replit.

## Current capabilities

- Project registry and isolated workspace directories
- Workspace file read/write API with path traversal protection
- Agent task queue boundary (provider-neutral)
- Skill/API/tool registry
- Code Guardian secret-pattern gate
- Deterministic platform self-test
- Preview boundary
- Explicit deployment gate that fails closed until a deployment provider is configured
- Existing EASY Core remains a separate project and is not replaced

## Architecture

`EASY Group -> Developer Platform -> Projects -> Agent -> Skills -> APIs -> Tools -> Guardian -> Tests -> Preview -> Deploy`

## Deliberate safety boundaries

The platform does not claim to execute an external AI agent or deploy production services until a concrete provider/runtime is connected and validated. Provider selection is intentionally deferred.

## Version

0.2.0
