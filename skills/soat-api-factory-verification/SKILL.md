---
name: soat-api-factory-verification
description: Verify SOAT-backed API Factory execution with real health, authentication, provider resolution, API Factory probe, real completion, official smoke evidence, and explicit commercial progression from entry-point verification to observed usage.
license: MIT
---

# SOAT API Factory Verification

SOAT success is a prerequisite, not a permanent commercial blocker. Use this Skill to consume verified SOAT evidence and move toward real usage.

## Verification gates

Require independent evidence for:
1. SOAT health.
2. Authentication.
3. Provider resolution.
4. API Factory authenticated probe.
5. Real AI completion.
6. Official SOAT smoke suite.
7. Execution-contract validation and persisted evidence.

CI configuration alone is not proof. A real completion must be non-empty and produced by the configured runtime.

## Evidence contract

Record the immutable SOAT source ref, workflow/run and commit, provider/backend identity, gate results, runtime evidence, and production status. Evidence consumers must fail closed when evidence is missing, malformed, unverifiable, or incomplete.

## Commercial progression

After SOAT_SUCCESS, do not rebuild SOAT merely because commercial evidence is missing:

ENTRY_POINT_VERIFIED → USAGE_OBSERVED → CUSTOMER_ACTION_OBSERVED → REVENUE_OBSERVED → PAYOUT_OBSERVED

ENTRY_POINT_VERIFIED means a real usable entry point exists. USAGE_OBSERVED requires an actual external user/customer interaction outside the CI test account. CI-only probes are insufficient.

For repeatable commercial progression, require a second independent production use before treating usage as repeatable. CUSTOMER_ACTION_OBSERVED requires an independently attributable customer action. REVENUE_OBSERVED requires a real qualifying provider/commerce event (for example a confirmed commission or payment), not link reachability, provider health, or synthetic tests. PAYOUT_OBSERVED requires independent evidence that the earned amount was actually paid or settled.

### Composition with existing Skills

- `soat-runtime-verification`: establishes technical runtime evidence and the boundary for ENTRY_POINT_VERIFIED.
- `ai-evaluation-evidence`: supplies reproducible regression/quality evidence; evaluation success does not imply commercial success.
- `multi-modal-provider-gateway`: supplies provider preflight, error taxonomy, bounded retry, circuit breaker, idempotency, capability registry, and adapter-boundary reliability controls.
- `knowledge-route-discovery`: selects these existing Skills before proposing a new Skill; do not create duplicate commercial/evidence layers.

Never promote a lower state merely because a higher-level system is healthy. Each transition needs its own evidence.

## Current baseline

The free baseline is SOAT + local Ollama. External provider paths remain blocked until real credentials and real completion evidence exist.

Never label simulated responses, mocks, static checks, or CI-only probes as commercial usage.
