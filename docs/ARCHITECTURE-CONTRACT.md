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
- PROVIDER: external execution/integration boundary. Provider availability must never be inferred from an adapter interface.

## 3. Single-source-of-truth rules

1. No new component may duplicate an existing component's responsibility.
2. Before adding a Skill, Tool, API, or Workflow, search the repository for an existing equivalent.
3. If two components have overlapping responsibility, MERGE or REMOVE; do not add a third layer.
4. Architecture changes require updating this contract in the same change.
5. A workflow may call a tool, but a tool must not silently become a second workflow engine.
6. Skills define policy; tools produce evidence; workflows orchestrate; CORE implements product behavior.

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

## 6. Workflow policy

EASY Platform Supervision is the platform-level verification workflow. Other workflows may remain only when they own a distinct repository responsibility and do not duplicate platform supervision.

No new workflow may be introduced merely to repeat an existing check. If a check belongs to platform supervision, add it there or extract deterministic logic into a Tool and call it from there.

Workflows must use least-privilege permissions and explicit triggers. Manual dispatch may be used for controlled verification; GitHub supports `workflow_dispatch` and scoped `permissions` for this purpose.

## 7. Platform readiness gate

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

## 8. Cleanup rule

When the architecture is consolidated, obsolete workflows/tools/skills must be removed only after their responsibilities have been mapped to the surviving component and the replacement has been verified. Do not delete blindly.

## 9. Forbidden shortcuts

- No fabricated test results.
- No claiming a public URL from source code alone.
- No provider success without a real provider operation.
- No autonomous write/deploy authority unless explicitly implemented, permissioned, tested, and approved.
- No weakening of Guardian or fail-closed checks to make CI green.
