---
name: revenue-capability-factory
description: Use when the revenue engine encounters a missing skill, API, tool, adapter, test harness, or workflow. Convert the gap into the smallest production-useful capability and require implementation, failure behavior, deterministic tests, and CI evidence before promotion.
metadata:
  version: "1.0.0"
---
# Revenue Capability Factory

## Mission
Keep the revenue engine moving without disguising missing functionality as success.

## Procedure
1. State the exact desired revenue-engine outcome.
2. Inspect the current capability graph and existing repository assets before building anything.
3. Identify the first blocking gap.
4. Choose the smallest appropriate artifact: skill, API, tool, adapter, data store, test harness, or workflow.
5. Implement a provider-neutral contract and fail-closed behavior.
6. Add deterministic tests covering success, invalid input, duplicate/retry, and dependency failure where applicable.
7. Add or extend CI so the new capability is continuously checked.
8. Re-run the blocked path and record observed evidence.
9. Promote only when implementation + failure behavior + test + CI evidence exist.
10. Repeat for the next gap.

## Hard boundaries
- Never fabricate provider success, commissions, customers, revenue, clicks, or payout events.
- Never store credentials in source code or test fixtures.
- Never enable an external provider merely because configuration exists.
- Never bypass offer verification or compliance checks.
- Credits are not cash unless a provider explicitly confirms a cash payout event.

## Output contract
Return machine-readable capability records with:
- capability
- type
- implementation
- dependencies
- failure behavior
- tests
- CI evidence
- status: `missing | building | verified | blocked`

A capability is not `verified` until runtime evidence exists for the applicable integration boundary.
