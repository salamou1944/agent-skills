# Adapter contract

Every executable capability exposed to the Operator implements the same conceptual contract:

- identity: stable capability ID
- source: repository + revision + license
- inputs: typed and bounded
- scope: explicit project/target/resource allowlist
- authorization: credential/session + granted operation
- execute: deterministic adapter operation
- evidence: action result, tool output metadata, input/output hashes where useful
- verify: independent check not derived solely from the adapter's claim
- failure: explicit AUTH_REQUIRED / BLOCKED_PERMISSION / BLOCKED_EXTERNAL_DEPENDENCY / FAILED
- idempotency: stable key for mutations
- timeout: bounded
- rollback: declared where applicable
- secrets: never returned in evidence
- health: configured/authorized/reachable/operation-tested
- provenance: source revision and runtime version

The Operator must not expose an unregistered arbitrary shell command as a remote capability. New commands become registered adapters with tests.
