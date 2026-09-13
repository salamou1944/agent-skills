# EASY Architecture Contract

Status: NORMATIVE

This document is the repository source of truth for architecture decisions. AI agents, Codex sessions, Skills, tools, APIs, and workflows must read and obey it before making architectural changes.

## 1. Mission

Build one coherent EASY Developer Platform, not a collection of overlapping automation systems. Prefer the smallest design that provides the required capability with direct evidence.

## 2. Layers

- CORE: stable platform runtime and domain logic. CORE owns behavior; it does not orchestrate GitHub CI policy.
- API: explicit runtime interface exposed by CORE. APIs must have deterministic contracts and fail closed on invalid or unsafe input.
- TOOL: deterministic executable operation used by automation or operators. A tool must do one well-defined job and return machine-readable evidence.
- SKILL: procedural policy/instructions that tell an agent how to reason or operate. A Skill is not a substitute for executable verification.
- WORKFLOW: GitHub Actions orchestration. Workflows coordinate repository checks and tools; they must not duplicate application logic.
- SUPERVISOR: the single orchestration role responsible for deciding what to inspect, what evidence is missing, and what safe verification/fix action is next.
- OPERATOR: task execution boundary that turns an authorized goal into a bounded plan, queues work, invokes allowlisted Tools, records evidence, retries bounded failures, and produces an auditable report. The Operator cannot bypass Guardian, approval, or Provider gates.
- PROVIDER: external execution/integration boundary. Provider availability must never be inferred from an adapter interface.

## 3. Single-source-of-truth rules

1. No new component may duplicate an existing component's responsibility.
2. Before adding a Skill, Tool, API, or Workflow, search the repository for an existing equivalent.
3. If two components have overlapping responsibility, MERGE or REMOVE; do not add a third layer.
4. Architecture changes require updating this contract in the same change.
5. A workflow may call a tool, but a tool must not silently become a second workflow engine.
6. Skills define policy; tools produce evidence; workflows orchestrate; CORE implements product behavior; the Operator manages bounded task execution.

## 4. Evidence contract

No evidence, no assertion.

Use only these status terms unless stronger evidence exists:
- PLANNED
- IMPLEMENTED
- VERIFIED
- UNVERIFIED
- BLOCKED
- FAILED
- LIVE

Do not claim READY, DONE, FIXED, PASSED, or LIVE without direct evidence appropriate to the claim.

Evidence must be bound to the exact revision, run, artifact, endpoint, or response that was checked. Static source code is not runtime evidence. A preview is not a deployment. An adapter interface is not a provider connection.

## 5. Change discipline

For every engineering run:
1. Inspect current state and failures first.
2. Select one highest-value safe action.
3. Make the smallest coherent change.
4. Run the exact relevant verification against that change.
5. Preserve Guardian, isolation, approval, authentication, and fail-closed boundaries.
6. Report verified evidence and remaining blockers only.

Do not add unrelated features while a current blocker remains unresolved.

## 6. AI Operator policy

The Operator is intentionally split into deterministic and provider-dependent boundaries:
- `ai-operator.mjs` owns deterministic goal normalization, Guardian scanning, syntax verification, approval gating, and evidence production.
- `operator-tools.mjs` is the allowlisted executable Tool registry. It must not expose arbitrary shell execution.
- `operator-state.mjs` owns durable task state and status transitions.
- `operator-worker.mjs` owns bounded queue processing and reporting; continuous operation requires an explicitly managed host/service and must not be implied by the source file.
- `operator-intelligence.mjs` is the provider-neutral AI planning boundary. It may call an OpenAI-compatible endpoint only when endpoint, model, and API key are explicitly configured; missing or failed provider configuration is reported as UNAVAILABLE/FAILED rather than simulated.
- High-risk goals remain blocked until explicit approval. A configured provider is not evidence that an external action was executed successfully.

The Operator may perform authorized security verification on owned or explicitly authorized systems, but it must not bypass access controls, attack third-party systems, exfiltrate secrets, or evade security controls.

## 7. Workflow policy

`EASY Platform Supervision` is the single workflow responsible for end-to-end EASY Developer Platform verification. It owns platform syntax, integration, provider-boundary, runtime, gateway handoff, dashboard, and repository-platform audit checks.

`EASY CI Governor` remains only as repository-wide CI governance and final fail-closed promotion logic. It must not create a second platform verification implementation.

`EASY CI Recovery` remains only as the failure-diagnosis/recovery boundary for Governor failures. It must not bypass gates or duplicate platform tests.

Other workflows may remain only when they own a distinct repository responsibility (for example, Code Guardian or an independent Skill self-test). They are not alternative EASY Platform verification systems.

The obsolete duplicate `easy-developer-platform.yml` platform test workflow is removed. Its platform test responsibilities are now executed by `EASY Platform Supervision`.

No new workflow may be introduced merely to repeat an existing check. If a check belongs to platform supervision, add it there or extract deterministic logic into a Tool and call it from there.

Workflows must use least-privilege permissions and explicit triggers. Manual dispatch may be used for controlled verification.

## 8. Platform readiness gate

The platform is not considered ready or live until all required gates have direct evidence:
- repository architecture audit passes;
- syntax/tests pass on the exact revision;
- platform runtime starts;
- health endpoint responds successfully;
- runtime contract checks pass;
- gateway-to-platform handoff succeeds when gateway is part of the current release;
- dashboard response is verified;
- no unresolved blocking CI failure remains;
- public deployment, if claimed, has an accessible endpoint and successful health check.

Provider-neutral state is intentionally not production execution: executionReady, githubReady, and deployReady must remain false until real provider contracts are verified.

## 9. Cleanup rule

When the architecture is consolidated, obsolete workflows/tools/skills must be removed only after their responsibilities have been mapped to the surviving component and the replacement has been verified. Do not delete blindly.

## 10. Forbidden shortcuts

- No fabricated test results.
- No claiming a public URL from source code alone.
- No provider success without a real provider operation.
- No autonomous write/deploy authority unless explicitly implemented, permissioned, tested, and approved.
- No weakening of Guardian or fail-closed checks to make CI green.
