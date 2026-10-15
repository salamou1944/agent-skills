---
name: provider-routing-benchmark
description: Benchmarks provider routing, fallback, budget, and guardrail behavior against the existing Salamou-31 API Factory without creating a second gateway control plane.
---
# Provider Routing Benchmark

## Procedure
1. Pin the external routing implementation and record its license/dependencies.
2. Define a fixture covering provider selection, fallback, quota failure, budget limits, guardrails, and observability.
3. Run the fixture against the existing Salamou-31/API Factory boundary.
4. Run the equivalent fixture against the external implementation in isolation.
5. Compare correctness, failure semantics, policy enforcement, latency, and operational complexity.
6. Extract only a primitive that measurably improves the existing boundary.
7. Preserve the existing API Factory as the single provider-control plane unless evidence proves otherwise.

## Completion rule
A benchmark result is evidence for a narrowly scoped improvement, not permission to import an entire gateway.
