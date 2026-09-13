# EASY Developer Platform

EASY Developer Platform is the control plane for EASY Group: a provider-neutral developer environment intended to be the foundation on which EASY itself can be built.

## Current capabilities

- Project registry with isolated file-backed workspaces
- Workspace file read/write API with path traversal protection
- Persistent platform state using atomic JSON writes
- Provider-neutral Agent task lifecycle: `queued -> validated -> ready_for_execution -> execution_unavailable`
- Skill/API/tool registry
- Code Guardian sensitive-pattern gate
- Workspace-wide Guardian scan
- Deterministic platform verification endpoint and CI self-test
- Runtime readiness endpoint for Agent, GitHub and deployment providers
- Build orchestration pipeline: `queued -> guarded -> tested -> preview_ready -> provider_unavailable/ready_for_provider`
- Local preview boundary
- Explicit deployment gate that fails closed until a real deployment provider and adapter are configured
- Existing EASY Core remains a separate project and is not replaced
- OpenAPI contract at `platform-control.openapi.yaml`

## Build contract

A project can be placed into the platform build pipeline through `/api/builds`. Each build must pass the workspace Guardian gate before it can advance to testing and preview readiness. If no validated execution provider exists, the pipeline stops explicitly at `provider_unavailable`; it never pretends that external execution occurred.

This makes the platform suitable as the controlled foundation for building EASY while preserving a strict distinction between implemented local capabilities and external integrations that still require adapters.

## Architecture

`EASY Group -> Developer Platform -> Projects -> Workspace -> Agent -> Skills -> APIs -> Tools -> Guardian -> Tests -> Orchestration -> Preview -> Deploy`

## Provider boundaries

The platform exposes explicit readiness state rather than silently assuming integrations exist:

- `EASY_AGENT_PROVIDER` enables the Agent execution boundary.
- `EASY_GITHUB_PROVIDER` identifies a GitHub integration boundary.
- `EASY_DEPLOY_PROVIDER` identifies a deployment provider boundary.

Setting a provider name does not magically implement the integration. Every provider must still have a validated adapter before production execution or deployment is allowed.

## Safety model

- Workspace paths are confined to the project workspace root.
- Guardian blocks known credential/private-key/token patterns.
- Agent tasks never execute merely because they were queued.
- Builds cannot pass the Guardian gate when sensitive patterns are detected.
- Deployment fails closed when no validated adapter exists.
- External AI generation is not enabled by this platform.

## Version

0.5.0
