---
name: engineering-agent-benchmark
description: Benchmarks an external coding-agent runtime against the existing Elite/ARMY-14 engineering control plane using isolated, task-specific evidence instead of wholesale adoption.
---
# Engineering Agent Benchmark

## Procedure
1. Pin the external agent revision and record its license, dependencies, runtime, and sandbox boundary.
2. Select a representative engineering task with a reproducible acceptance test.
3. Run the external agent in an isolated environment with bounded permissions.
4. Measure retrieval quality, implementation correctness, test completion, repair behavior, evidence quality, and cleanup.
5. Compare the result against the existing Elite/ARMY-14 path.
6. Extract only a narrowly superior reusable procedure when a measurable gap exists.
7. Reject wholesale control-plane replacement when the benchmark does not demonstrate a non-duplicative advantage.

## Security
Sandbox external coding agents. Never expose credentials, unrestricted host access, production systems, or security controls merely to improve benchmark scores.

## Provenance
This Skill operationalizes the OpenHands evaluation path identified in Collection. It is a benchmark/extraction method, not an OpenHands runtime integration.
