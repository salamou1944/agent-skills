# EASY Developer Platform v2

EASY Developer Platform is the guarded control plane for EASY Group and the foundation on which EASY can be built.

## v2 capabilities

- Project registry and project-isolated workspaces
- Atomic persistent state with bounded event history
- Workspace path confinement and request-size limits
- Write-time Code Guardian gate: known credentials/tokens/private keys are rejected before persistence
- Workspace-wide Guardian scanning
- Provider-neutral Agent lifecycle: `queued -> validated -> ready_for_execution -> execution_unavailable`
- Build orchestration with independent Guardian, syntax, preview, approval and provider gates
- Explicit human approval gate before a build can proceed beyond preview readiness
- Real Node syntax validation for `.js`, `.mjs`, `.cjs`, using `shell:false` and a hard timeout
- Skill/API/tool registry
- Runtime readiness boundaries for Agent, GitHub and deployment providers
- Audit/event history for project, workspace, build and approval actions
- Local preview boundary
- Deployment fails closed until a real validated adapter exists
- OpenAPI 3.0.3 contract for the v2 control surface
- Existing EASY Core remains separate and is not replaced

## v2 build contract

`queued -> Guardian -> syntax tests -> preview boundary -> explicit approval -> provider boundary`

A failed gate stops progression. A provider environment variable alone does not authorize execution or deployment. The platform never claims an external Agent, GitHub writer, hosted preview or deployment system exists unless its adapter is actually implemented and configured.

## Security model

- Optional bearer API-key authentication is enabled when `EASY_API_KEY` is configured.
- Health and platform metadata remain readable for operational discovery.
- Workspace paths are confined to their project root.
- Workspace writes are Guardian-gated before persistence.
- Request bodies are capped at 2 MB.
- Build approval is explicit and recorded.
- Sensitive values are never generated or stored by the platform.

## Provider boundaries

- `EASY_AGENT_PROVIDER` — Agent execution adapter boundary.
- `EASY_GITHUB_PROVIDER` — GitHub synchronization/write adapter boundary.
- `EASY_DEPLOY_PROVIDER` — deployment adapter boundary.

These names are readiness signals only; validated adapters remain required.

## Verification

Run the repository self-test with:

`node apps/easy-developer-platform/test.mjs`

The v2 self-test covers authentication boundary behavior, project/workspace isolation, write-time Guardian blocking, syntax validation, Agent lifecycle, build gates, approval, provider fail-closed behavior and deployment blocking.

## Version

2.0.0
