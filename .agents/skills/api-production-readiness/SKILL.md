---
name: api-production-readiness
description: "Determine whether an API is actually ready for real customers or production. Trigger before launch, sale, demo, release, or when asked to audit, test, or verify API readiness. Inspect the API surface, run real tests when possible, separate runtime evidence from static analysis, and produce a release verdict with prioritized fixes."
metadata:
  version: "2.0.0"
---

# API Production Readiness

Perform an evidence-based API release audit. The objective is to establish whether the API is safe and reliable enough for real users, not merely whether the code compiles.

## Non-negotiable rules

- Inspect the repository before making claims.
- Never claim an endpoint was executed unless an actual request was made and its result observed.
- Separate `observed`, `inferred`, and `not tested` findings.
- Missing tests are a readiness gap, not proof of a defect.
- Do not invent routes, schemas, authentication behavior, expected values, or dependencies.
- Never expose secrets, tokens, credentials, or private configuration values.

## Audit workflow

### 1. Establish the API surface

Identify the runtime/framework, entry points, routes and HTTP methods, request/response schemas, authentication and authorization boundaries, persistence, external dependencies, configuration requirements, and existing unit/integration/contract/e2e tests.

If the API surface cannot be established, verdict is `NOT_READY`.

### 2. Static readiness review

Check the relevant implementation and configuration for:

- Input validation and type/schema enforcement.
- Authentication and authorization consistency.
- Correct HTTP status semantics and stable error responses.
- Null, empty, malformed, and boundary inputs.
- Idempotency and duplicate/retry behavior where relevant.
- Timeouts, retries, and dependency failure handling.
- Database transaction and consistency risks.
- Logging that could expose sensitive information.
- CORS/transport configuration where applicable.
- Health checks and observability.
- Rate limiting or abuse controls where appropriate.
- Dependency/configuration assumptions.
- Documentation versus implementation mismatches.
- Deployment and rollback assumptions.

Cite exact files and lines for concrete findings when available.

### 3. Runtime verification

Run the project's existing test suite first. Then execute the smallest relevant API/integration checks needed to verify important behavior.

Cover, where applicable:

1. Happy path.
2. Missing required input.
3. Wrong type or malformed payload.
4. Boundary values.
5. Unauthorized request.
6. Forbidden request.
7. Not-found behavior.
8. Duplicate/retry behavior.
9. Dependency failure or timeout.
10. Response contract and status-code correctness.

Record the command, endpoint/method, observed result, and reproducibility. Distinguish mocked/simulated checks from real external behavior.

If runtime execution is unavailable, label the audit `STATIC_ONLY`; never imply runtime validation occurred.

### 4. Classify findings

- `CRITICAL` — security, data integrity, or availability issue that can make release unsafe.
- `HIGH` — major functional or reliability defect affecting normal production use.
- `MEDIUM` — meaningful correctness, resilience, or contract gap that should be fixed before broad release.
- `LOW` — limited-risk improvement or maintainability issue.
- `INFO` — observation without a direct release blocker.

### 5. Release verdict

Use exactly one:

- `READY` — no Critical/High findings and important runtime paths were verified.
- `READY_WITH_WARNINGS` — no Critical/High blockers, but meaningful gaps remain or runtime coverage is incomplete.
- `NOT_READY` — any Critical/High blocker exists, or release safety cannot be established.

Never return `READY` from a static-only audit.

## Output contract

```text
API Production Readiness
Verdict: READY | READY_WITH_WARNINGS | NOT_READY
Execution: FULL_RUNTIME | PARTIAL_RUNTIME | STATIC_ONLY

Release blockers
- [severity] finding — evidence — affected endpoint/file

Verified
- test/check — observed result

Tests still needed
- test — reason

Priority fixes
1. fix
2. fix
3. fix

Next action
- smallest concrete step toward release
```

Every finding must identify whether it is observed, inferred, or not tested. Do not hide uncertainty behind a confident verdict.

## Examples

- "Is this API production ready?"
- "Audit this API before I sell it to a client."
- "Test the endpoints and tell me what is broken."
- "Find the highest-risk API issues and prioritize the fixes."

## Troubleshooting

- If dependencies are unavailable, report the environmental blocker separately from application defects.
- If credentials are required, do not ask the user to paste secrets into chat. Use an already configured safe test environment or report that authenticated runtime verification could not be completed.
- If documentation and implementation disagree, report the discrepancy rather than choosing one as truth.
