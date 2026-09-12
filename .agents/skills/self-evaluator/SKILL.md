---
name: self-evaluator
description: Measure agent skill quality, coverage, reliability, regression risk, and evidence quality across repeatable evaluation cases.
---
# Self Evaluator

1. Discover active skills and evaluation cases.
2. Score each case for coverage, correctness, evidence, reproducibility, and safety.
3. Compare current results with the previous baseline.
4. Record regressions, weak capabilities, and missing evaluation coverage.
5. Produce machine-readable metrics and a concise human report.
6. Never treat a passing static validator as proof of runtime correctness.

Required output:
- overall score
- per-capability score
- regressions
- uncovered capabilities
- recommended next experiments

A skill is not promoted solely because it exists or passes metadata validation.
