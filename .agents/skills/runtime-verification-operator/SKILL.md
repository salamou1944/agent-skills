---
name: runtime-verification-operator
description: Verify real runtime availability, API behavior, and website access before any readiness or live claim.
---

# Runtime Verification Operator

## Rule
No runtime claim without runtime evidence.

## Required sequence
1. Identify the exact revision/environment.
2. Verify the process or deployment exists.
3. Call the real health endpoint.
4. Call the real platform contract endpoint.
5. Exercise one safe read path and one safe write path when available.
6. Record HTTP status, response, timestamp, revision, and URL.
7. If any required gate is missing, report `UNVERIFIED` or `BLOCKED`.

## Prohibitions
- Do not treat source code, a static GitHub file, mock data, or a planned deployment as a live service.
- Do not treat a queued workflow as a passed workflow.
- Do not report `LIVE`, `READY`, `PASSED`, or `FIXED` without current evidence.

## Output
Return a compact evidence record containing `status`, `revision`, `environment`, `endpoint`, `checks`, `failures`, and `checkedAt`.
