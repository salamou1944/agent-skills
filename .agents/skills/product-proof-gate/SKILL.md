---
name: product-proof-gate
description: Prove a skill is implemented, integrated, tested, security-reviewed, and supported by exact-SHA CI evidence before treating it as a product.
---

# Product Proof Gate

## Purpose
Treat every skill as a product candidate only after deterministic evidence proves that its promised behavior is implemented, integrated, tested, and safely bounded.

## Required evidence
1. Complete executable contract.
2. Real implementation path wired into the runtime.
3. Positive integration test.
4. Relevant negative/failure tests.
5. Exact commit or PR-head CI evidence.
6. Security review before promotion.
7. No simulated provider success or environment-variable-only readiness.
8. User-facing limitations and provider dependencies documented.

## Security review minimum
Check secret leakage, path traversal, injection/shell boundaries, authorization, input validation, provider fail-closed behavior, sensitive persistence/logging, dependency risk, destructive operations, approval gates, and auditability.

## Required output
```text
skill: <name>
implementation: proven | missing | unverified
integration_test: pass | fail | missing
failure_test: pass | fail | missing
ci: verified | ci_unverified | failed
security: pass | fail | missing
product_status: proven_product | blocked
blockers: <none or exact gaps>
```

Never call a skill a product solely because its documentation exists. Never infer CI or security approval.
