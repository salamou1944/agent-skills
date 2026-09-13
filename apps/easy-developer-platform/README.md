# EASY Developer Platform

EASY Developer Platform is the control plane for EASY Group and the controlled foundation on which EASY can be built.

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
- Real Node syntax validation for `.js`, `.mjs`, and `.cjs` files, executed without a shell and with a hard timeout
- Local preview boundary
- Explicit deployment gate that fails closed until a real deployment provider and adapter are configured
- Existing EASY Core remains a separate project and is not replaced
- OpenAPI contract at `platform-control.openapi.yaml`

## Build contract

A project enters the controlled build pipeline through `/api/builds`. Every build must pass the workspace Guardian gate and the safe Node syntax gate before it reaches preview readiness. If no validated execution provider exists, the pipeline stops explicitly at `provider_unavailable`; it never claims that an external Agent executed the build.

## What remains an external integration

The platform deliberately does not fake capabilities that require infrastructure or credentials. A production Agent runtime, GitHub write/synchronization adapter, production sandbox, hosted preview service, and deployment adapter require their respective validated implementations and configuration. Their readiness is exposed by the runtime boundary.

## Architecture

`EASY Group -> Developer Platform -> Projects -> Workspace -> Agent -> Skills -> APIs -> Tools -> Guardian -> Tests -> Orchestration -> Preview -> Deploy`

## Provider boundaries

- `EASY_AGENT_PROVIDER` — Agent execution boundary.
- `EASY_GITHUB_PROVIDER` — GitHub integration boundary.
- `EASY_DEPLOY_PROVIDER` — deployment provider boundary.

A provider name alone never authorizes execution or deployment. A validated adapter is required.

## Safety model

- Workspace paths are confined to the project workspace root.
- Guardian blocks known credential/private-key/token patterns.
- Agent tasks never execute merely because they were queued.
- Build progression is fail-closed on Guardian or syntax failures.
- Node syntax checks use `shell:false` and a timeout.
- Deployment fails closed when no validated adapter exists.
- External AI generation is not enabled by this platform.

## Version

0.5.1
