# EASY Developer Platform v2

EASY Developer Platform is the guarded control plane for EASY Group and the foundation on which EASY can be built.

## Verified foundation

- Project registry and project-isolated workspaces
- Atomic persistent state with bounded event history
- Workspace path confinement and request-size limits
- Write-time Code Guardian gate and workspace-wide Guardian scanning
- Real Node syntax validation with bounded child processes
- Provider-neutral Agent lifecycle and fail-closed execution boundary
- Build orchestration with Guardian, syntax, preview, approval and provider gates
- Explicit human approval gate before provider execution
- Skill/API/tool registry
- Audit/event history
- Local preview boundary
- AI Operator kernel with durable task state, allowlisted Tools and bounded worker
- Live external Railway smoke verification

## Creative Engine foundation

The next EASY product stage now has a real deterministic core in `creative-core.mjs`.

### Product DNA

`createProductDNA()` creates a versioned Product DNA record with:

- source asset identity and dimensions/fingerprint metadata
- product identity/category/type
- immutable attributes: brand name, printed text, logo, color, shape, components, design details and material
- flexible attributes: background, environment, lighting, camera, composition, objects, effects and context
- provenance and a stable SHA-256 DNA fingerprint

The core does not invent visual facts. It accepts declared observations until a real vision adapter is installed.

### Product Integrity

`checkProductIntegrity()` compares a candidate creative against immutable Product DNA and returns `PASS` or `BLOCK`. Any immutable mismatch is a hard failure.

`validateCreativeOutput()` adds a second gate that blocks unverified marketing claims.

### Provider-neutral creative compilation

`compileCreativeInstruction()` produces a provider-neutral instruction package with explicit hard rules. External generation is disabled until a real provider adapter implements the contract:

- `analyzeAsset`
- `generateCreative`
- `validateOutput`

No environment variable alone can promote the provider to ready.

## Creative verification

Run:

`npm run test:creative`

The suite verifies Product DNA creation, stable fingerprinting, immutable color/text protection, instruction compilation, output-claim validation and the disabled provider boundary. CI runs the same suite on relevant changes.

## AI Operator

The Operator is an executable repository component, not a claim of an always-on hosted agent.

- `ai-operator.mjs` — deterministic goal planning, Guardian scan, syntax verification and approval gate.
- `operator-tools.mjs` — allowlisted evidence-producing Tools; arbitrary shell execution is not exposed.
- `operator-state.mjs` — durable JSON task state with explicit lifecycle statuses.
- `operator-worker.mjs` — bounded queue worker and machine-readable report.
- `operator-intelligence.mjs` — optional OpenAI-compatible planning boundary. It remains unavailable unless endpoint, model and API key are explicitly configured.

## Build contract

`queued -> Guardian -> syntax tests -> preview boundary -> explicit approval -> provider boundary`

A failed gate stops progression. The platform never claims an external Agent, GitHub writer, hosted preview or deployment system exists unless its adapter is actually implemented and tested.

## Security model

- Optional bearer API-key authentication when `EASY_API_KEY` is configured.
- Health and platform metadata remain readable for operational discovery.
- Workspace paths are confined to project roots.
- Workspace writes are Guardian-gated before persistence.
- Request bodies are capped at 2 MB.
- Build approval is explicit and recorded.
- Sensitive values are never generated or stored by the platform.

## Version

2.1.0 foundation + Creative Engine 0.1.0
