---
name: api-production-readiness
description: Determine whether an API is actually ready to be offered to a real customer. Use before launch, sale, demo, or declaring an API production-ready.
---
# API Production Readiness

Verify with evidence: build/install, unit/integration/e2e tests, contract/schema validation, authentication and authorization, rate limits, error semantics, timeouts, retries, idempotency, observability, health checks, dependency resilience, secrets handling, documentation, deployment reproducibility, rollback, and failure behavior.

Run real tests where tooling permits. Separate simulated or mocked checks from real external behavior. Record commands, environment assumptions, pass/fail results, and unresolved risks. Never label an API production-ready merely because tests compile.
