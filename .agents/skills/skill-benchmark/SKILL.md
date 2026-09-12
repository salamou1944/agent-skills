---
name: skill-benchmark
description: Use to measure whether a skill actually improves outcomes. Build small repeatable evaluation cases, score outputs against explicit criteria, and compare versions or alternative skills before promotion.
---
# Skill Benchmark

Measure capability, not file count.

For each skill under evaluation:
- define 3–5 representative tasks;
- include at least one should-trigger and one should-not-trigger case;
- define observable pass/fail criteria;
- score correctness, completeness, robustness, efficiency, evidence, and safety;
- record failures and regression cases;
- compare against the previous version or baseline when available.

Promotion rule:
- measurable improvement on the target capability;
- no unacceptable regression on existing behavior;
- no security or authorization regression;
- reproducible evidence;
- clear trigger boundary.

When a benchmark exposes a repeatable missing capability, hand the failure to `skill-evolution-engine`.
