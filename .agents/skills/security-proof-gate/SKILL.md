# Security Proof Gate

## Purpose
Perform a mandatory security review behind every skill/product before it can be promoted or exposed as production-ready.

## Scope
Review the skill contract, implementation, tests, workflow, runtime entrypoint, dependencies, data handling, and operational boundaries.

## Procedure
1. Identify the exact implementation and runtime entrypoint.
2. Trace all inputs and outputs.
3. Check authentication and authorization boundaries.
4. Check secrets, credentials, tokens, private keys, and sensitive data handling.
5. Check filesystem paths, traversal, symlink/unsafe path behavior, and workspace isolation.
6. Check command/process execution for shell injection and unsafe arguments.
7. Check network/provider boundaries and require fail-closed behavior when providers are unavailable.
8. Check persistence, logs, artifacts, and error messages for accidental disclosure.
9. Check destructive operations, approvals, rollback, and audit trails.
10. Check dependencies and workflow actions for supply-chain exposure.
11. Execute or inspect positive and negative security tests.
12. Record findings with severity and a concrete remediation.

## Severity
- `critical`: exploitable path to secrets, unauthorized control, destructive access, or arbitrary code execution.
- `high`: meaningful privilege bypass, injection, isolation break, or sensitive-data exposure.
- `medium`: defense-in-depth weakness or unsafe edge case with bounded impact.
- `low`: hardening/documentation issue.

## Promotion rule
Any unresolved `critical` or `high` finding blocks promotion. A missing security test blocks `security: pass` when the behavior is security-sensitive.

## Required output
```text
skill: <name>
scope: <implementation/runtime paths>
critical: <count>
high: <count>
medium: <count>
low: <count>
security_tests: pass | fail | missing
security: pass | blocked
remediation: <exact actions or none>
```

## Prohibited
- Do not equate Code Guardian success with complete security approval.
- Do not declare a skill safe without inspecting its actual runtime path.
- Do not suppress findings because a feature is only a prototype.
- Do not expose or commit credentials while testing.
