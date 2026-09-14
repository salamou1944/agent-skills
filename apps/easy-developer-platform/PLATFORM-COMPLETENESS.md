# EASY Developer Platform — V2 completeness gate

This document defines the boundary between a verified V2 foundation and production capability. A module is not considered complete merely because an endpoint or name exists.

## Required evidence

Every capability must have:

1. Contract — request/response and invariants are defined.
2. Implementation — the code performs the operation rather than returning a simulated success.
3. Failure behavior — unsafe, unavailable, invalid, and timeout cases fail closed.
4. Integration test — the real path is exercised.
5. CI evidence — the relevant workflow passes on the current commit.
6. Provider evidence — when a capability depends on an external provider, the configured adapter is exercised before claiming production readiness.

## V2 status

Verified foundation:

- project registry and project-scoped workspace
- path traversal protection
- write-time and workspace Code Guardian gates
- real Node syntax validation with bounded child processes
- deterministic build state machine
- explicit approval gate
- audit/event persistence
- provider-neutral runtime boundaries
- fail-closed deployment boundary
- API-key authentication boundary
- deterministic V2 self-test

Explicitly NOT production-complete until a real adapter is installed and tested:

- autonomous LLM agent execution
- GitHub synchronization, commit and PR operations
- isolated production sandbox execution
- hosted preview infrastructure
- production deployment and rollback
- multi-user identity, organization tenancy and RBAC
- production database, migrations and backup/restore
- durable worker queue with retries/cancellation
- production observability, rate limiting and abuse controls

## Promotion rule

Do not promote a capability from `provider-unavailable` to a successful execution state based only on an environment variable. The adapter must implement the provider contract and pass an integration check. The same rule applies to GitHub and deployment providers.
