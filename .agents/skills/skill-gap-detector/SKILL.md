---
name: skill-gap-detector
description: Detect recurring task failures, uncovered capabilities, weak evaluation coverage, and capability gaps that justify a new skill.
---
# Skill Gap Detector

1. Collect failed, partial, and low-confidence task outcomes.
2. Cluster failures by missing capability rather than by wording.
3. Check whether an existing skill can solve the gap with a small revision.
4. Reject duplicate or cosmetic skill ideas.
5. Define a measurable capability contract for each genuine gap.
6. Emit a candidate only when the gap is reproducible or materially important.

Every candidate must state:
- observed gap
- evidence
- existing skills considered
- new capability
- acceptance tests
- expected improvement
