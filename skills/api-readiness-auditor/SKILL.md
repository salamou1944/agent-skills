---
name: api-readiness-auditor
description: "Audit an API or API project before production release. Trigger for requests such as 'audit my API', 'is this API production ready?', 'test this API', 'find API bugs', or 'check API readiness'. Inspect the repository and API contract, identify concrete functional and reliability gaps, design executable tests, and produce a release verdict with prioritized fixes."
metadata:
  version: "1.0.0"
---

# API Readiness Auditor

Perform a structured, evidence-based readiness audit of an API project. The goal is to determine whether the API is ready for real users, not merely whether the code looks reasonable.

## Core Rules

- Inspect the repository before making claims.
- Never claim an endpoint was executed unless an actual request was made and its result observed.
- Separate static findings from runtime findings.
- Treat missing tests as a readiness gap, not proof of a bug.
- Do not invent endpoints, authentication behavior, schemas, dependencies, or expected responses.
- Never expose secrets, tokens, credentials, or private configuration values in the report.
- Prioritize reproducible, concrete findings over stylistic opinions.

## Audit Workflow

### 1. Establish the API surface

Identify the runtime/framework, API entry points, routes and methods, request/response schemas, authentication and authorization boundaries, external dependencies, persistence, and existing tests. If the API surface cannot be established, stop with `NOT_READY` and explain what is missing.

### 2. Perform static checks

Review relevant files for input validation, authentication/authorization consistency, error handling, HTTP status semantics, malformed and boundary input handling, idempotency where relevant, timeouts and dependency failures, transaction/consistency risks, sensitive logging, CORS/transport configuration where applicable, dependency/configuration assumptions, and documentation mismatches.

For every finding, cite the exact file and line when available.

### 3. Build the runtime test matrix

Create tests for at least:

1. Happy-path request.
2. Missing required input.
3. Wrong type or malformed payload.
4. Boundary values.
5. Unauthorized request.
6. Forbidden request when roles/permissions exist.
7. Not-found behavior.
8. Duplicate/retry behavior where relevant.
9. Dependency failure or timeout where testable.
10. Response contract and status-code correctness.

Derive expected values from the implementation, schema, documentation, or existing tests. Never fabricate them.

### 4. Execute tests when execution is available

Run the existing test suite first, then the smallest relevant API/integration tests or direct HTTP checks needed to verify important findings. Record commands, endpoint/method, observed status, mismatches/failures, and reproducibility.

If runtime execution is unavailable, label the audit `STATIC_ONLY` and never imply runtime validation occurred.

### 5. Classify findings

Use exactly these severities:

- `CRITICAL` — security, data integrity, or availability issue that can make the API unsafe to release.
- `HIGH` — major functional or reliability defect affecting normal production use.
- `MEDIUM` — meaningful correctness, resilience, or contract gap that should be fixed before broad release.
- `LOW` — limited-risk improvement or maintainability issue.
- `INFO` — observation with no direct release blocker.

### 6. Produce the release verdict

Use exactly one:

- `READY` — no Critical/High findings and important runtime paths have been verified.
- `READY_WITH_WARNINGS` — no Critical/High blockers, but meaningful Medium/Low gaps remain or runtime coverage is incomplete.
- `NOT_READY` — any Critical/High blocker exists, or the API surface is incomplete enough that release safety cannot be established.

Never use `READY` for a static-only audit; use `READY_WITH_WARNINGS` when runtime verification is incomplete.

## Output Contract

Return:

```text
API Readiness Audit
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
- the smallest concrete step that moves the API toward release
```

For each finding distinguish `observed`, `inferred`, and `not tested` claims. Never hide uncertainty behind a confident verdict.

## Examples

- "Audit this API before I sell it to a client."
- "Is this API production ready?"
- "Test the endpoints and tell me what is broken."
- "Find the highest-risk API issues and give me the fixes in priority order."

## Troubleshooting

- If tests fail because dependencies are unavailable, report the environmental blocker separately from application defects.
- If authentication credentials are required, do not ask the user to paste secrets into chat. Explain the missing capability and use a safe authenticated test environment if one is already configured.
- If documentation and implementation disagree, report the discrepancy rather than choosing one as truth.
