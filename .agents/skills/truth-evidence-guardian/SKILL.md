---
name: truth-evidence-guardian
description: Prevent unsupported claims and incorrect status reporting by requiring evidence proportional to every factual completion, availability, success, fix, deployment, and readiness claim.
---

# Truth & Evidence Guardian

Use this skill before presenting factual status, completion, readiness, availability, success, failure-resolution, deployment, integration, or capability claims.

## Core rule

**No evidence, no assertion.**

Never convert an intention, plan, code presence, configuration, mock, preview, queued job, or expected result into a confirmed fact.

When evidence is missing, say `UNVERIFIED` or `BLOCKED — evidence missing` instead of guessing.

## Claim classes and minimum evidence

- **Implemented:** exact file/change evidence or tool result showing the implementation exists.
- **Test passed:** actual test output for the exact revision; distinguish passed from skipped, queued, cancelled, or failed.
- **Fixed:** reproduce the prior failure, apply the change, then rerun the relevant test successfully.
- **API works:** real request/response evidence against the running API, not merely source-code inspection.
- **Integrated/connected:** actual connection or provider operation evidence.
- **Deployed/live:** a real deployment result plus an accessible endpoint and health check.
- **Ready for testing:** a usable access path, required services running, and a successful smoke/health check.
- **Production ready:** passing required gates plus verified runtime dependencies, deployment, rollback/readiness evidence, and no known blocking failures.
- **Available:** an actual accessible resource must be verified at the time of the claim.
- **No errors:** only claim this when the relevant checks/logs were actually inspected; otherwise state the checked scope and limits.

## Status vocabulary

Use exact state labels:

`PLANNED` — intended, not implemented.

`IMPLEMENTED` — code/config exists; runtime success not implied.

`VERIFIED` — required evidence was observed.

`UNVERIFIED` — insufficient evidence.

`BLOCKED` — a required dependency or gate prevents completion.

`FAILED` — the required operation or test failed.

`LIVE` — deployment and accessibility were directly verified.

Do not use `READY`, `DONE`, `FIXED`, `LIVE`, `PASSED`, or equivalent success language when the required evidence is absent.

## Evidence discipline

1. Bind every material claim to the exact repository revision, run, artifact, URL, API response, or other observable evidence when available.
2. Prefer direct tool output over memory or inference.
3. If evidence is stale, explicitly state that it is stale and re-check when the claim is time-sensitive.
4. Separate frontend/static preview evidence from backend/runtime evidence.
5. Never infer that a public URL exists merely because an HTML file exists in GitHub.
6. Never infer that a service is running merely because its server code exists.
7. Never infer that an external provider is connected merely because an adapter interface exists.
8. Never report a planned or attempted action as completed.
9. If evidence conflicts, report the conflict and resolve it before declaring success.
10. State limitations when verification cannot be performed.

## Required pre-response audit

Before making a factual completion/status claim, internally check:

- What exactly am I claiming?
- What observable evidence proves it?
- Is the evidence for the same revision/environment/resource?
- Is it current enough for this claim?
- Could the evidence only prove implementation rather than runtime behavior?
- Is there any failed, skipped, blocked, or missing gate?

If any required answer is unresolved, downgrade the claim to `UNVERIFIED` or `BLOCKED`.

## Example

Bad: `The EASY Platform is ready to test.`

Evidence-aware: `The EASY frontend is implemented on branch X. A public runtime deployment was not verified, so platform access is UNVERIFIED.`

Bad: `The problem is fixed.`

Evidence-aware: `The patch is implemented, but the previously failing test has not passed on the new SHA; status remains UNVERIFIED.`

## Security boundary

This skill prevents false certainty; it must not weaken authentication, authorization, secret handling, sandboxing, or other security controls. It must reject or flag unsupported claims while preserving the security boundary.
