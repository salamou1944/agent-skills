# Product Proof Gate

## Purpose
Treat every skill as a product candidate only after deterministic evidence proves that its promised behavior is implemented, integrated, tested, and safely bounded.

## Rule
A skill result is not a product claim. A product claim requires proof.

## Required evidence
1. Skill contract is complete and executable.
2. Implementation path exists and is actually wired into the relevant runtime.
3. At least one positive integration test exercises the real path.
4. Negative/failure tests cover unsafe, invalid, missing-provider, or unavailable cases relevant to the skill.
5. CI evidence exists for the exact commit or PR head. If no run exists, status is `ci_unverified`, never success.
6. Security review passes before promotion.
7. No simulated provider success, fabricated output, or environment-variable-only readiness is accepted.
8. User-facing documentation states limitations and provider dependencies.

## Procedure
- Resolve skill -> implementation -> tests -> CI -> security evidence.
- Run or inspect the narrowest deterministic tests first.
- Trace the actual runtime entrypoint; do not rely on dead files or syntax-only checks.
- Inspect failure paths and authorization boundaries.
- Record missing evidence explicitly.
- If a gap is actionable, create the smallest corrective change and repeat the gate.
- Promote only when all mandatory gates are green.

## Security review minimum
Check:
- secret/credential leakage
- path traversal and unsafe file access
- injection and shell execution boundaries
- authentication/authorization
- untrusted input validation
- provider fail-closed behavior
- sensitive data persistence/logging
- dependency and supply-chain risk
- destructive operations and approval gates
- auditability and reproducibility

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

## Prohibited
- Never call a skill a product solely because its documentation exists.
- Never call a product production-ready solely because local tests pass.
- Never infer CI success from a configured workflow.
- Never infer security approval from absence of an obvious vulnerability.
