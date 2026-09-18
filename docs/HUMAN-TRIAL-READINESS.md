# Human Trial Readiness

## Purpose

This checkpoint defines the minimum evidence required before a real person is invited to exercise the EASY / Elite / ARMY-14 / MONY stack.

Human trial is not the same as production completion. It means a bounded, observable, reversible pilot can be executed without bypassing the repository's fail-closed evidence rules.

## Entry criteria

A human trial may start only when all of these are true:

1. Exact revision recorded — the deployed repository commit SHA is known.
2. Control plane verified — repository boundary and PR-only mutation policy tests pass.
3. Runtime reachable — the public runtime responds through the configured gateway.
4. Core surfaces healthy — platform, operator, creative, customer, and revenue health checks are available as applicable.
5. Safe creative path verified — fixture/deterministic creative execution succeeds and integrity validation passes.
6. No false revenue state — MONY test or synthetic events are never presented as cash revenue.
7. Human scope bounded — the pilot uses test/non-sensitive data, has a defined stop condition, and does not require bypassing auth, quotas, CAPTCHA/MFA, or provider controls.
8. Rollback path known — the operator can stop the pilot and return to the previous known-good deployment.
9. Evidence artifact emitted — endpoint results, revision, timestamp, and unresolved risks are recorded.

## Trial scope

The first human trial should be a small controlled pilot, not an open public launch:

- one or a few testers;
- non-sensitive/test product data;
- fixture/dry-run paths where live provider access is not required;
- no claims of revenue, conversion, or production readiness;
- every defect becomes task-specific evidence for repair.

## Required evidence record

```json
{
  "trial": "human",
  "revision": "<deployed commit SHA>",
  "runtimeUrl": "<public URL>",
  "checkedAt": "<ISO-8601>",
  "checks": [
    {"name": "gateway", "status": "PASS"},
    {"name": "integration", "status": "PASS"},
    {"name": "creative-fixture", "status": "PASS"}
  ],
  "decision": "READY|BLOCKED",
  "risks": []
}
```

`READY` is permitted only when every required check passes. Missing, ambiguous, or unavailable evidence means `BLOCKED`.

## Exit criteria

After the pilot, record:

- tester-observed failures;
- task-specific reproduction evidence;
- security/privacy issues;
- UX friction;
- provider failures and rate limits;
- whether the observed behavior matched the documented contract.

A successful human trial does not automatically promote the system to globally complete or production-ready.