# EASY Developer Platform

EASY Developer Platform is the control plane for EASY Group: a provider-neutral developer environment that can grow into a full development platform without pretending that an unconfigured external provider already exists.

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
- Local preview boundary
- Explicit deployment gate that fails closed until a real deployment provider and adapter are configured
- Existing EASY Core remains a separate project and is not replaced
- OpenAPI contract at `platform-control.openapi.yaml`

## Architecture

`EASY Group -> Developer Platform -> Projects -> Workspace -> Agent -> Skills -> APIs -> Tools -> Guardian -> Tests -> Preview -> Deploy`

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
- Deployment fails closed when no validated adapter exists.
- External AI generation is not enabled by this platform.

## Version

0.4.0
