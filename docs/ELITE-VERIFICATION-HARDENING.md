# Elite verification hardening

This layer closes reliability gaps that can hide behind a green test suite:

1. Independent evidence gate: task verification requires task-specific acceptance, tests, clean diff evidence, and a verifier distinct from the executing agent.
2. Patch identity: evidence is bound to a SHA-256 fingerprint of the exact patch object so evidence cannot silently drift to another artifact.
3. Retrieval measurement: repository exploration can be measured with precision, recall and F1 under a context budget; low-quality retrieval should trigger abstention rather than blind editing.
4. Fault matrix: provider, workspace, policy, verification and dependency failures have explicit expected actions.

The gate also rejects benchmark evidence that explicitly exposes ground truth or hidden evaluation data. This is a guardrail, not proof that a benchmark is contamination-free.

These controls complement the existing independent patch reconstruction and layered verification flow.

## Required production evidence

A task should not be promoted to TASK_VERIFIED unless the evidence bundle contains:
- task-specific acceptance;
- test results;
- clean diff;
- independent review;
- patch fingerprint matching the final artifact.

For external benchmarks, keep benchmark inputs, hidden tests and reference solutions outside the agent-visible context.

## Metrics

Retain retrieval precision/recall/F1, independent-verifier rejection rate, patch-fingerprint mismatch count, fault recovery by failure class, escaped defects and human intervention count. Do not collapse them into one headline score.
