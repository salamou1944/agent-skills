---
name: ci-self-improvement
description: Convert repeated CI capability gaps into evidence-backed skills with non-duplicate checks, acceptance tests, and promotion gates.
---

# CI Self-Improvement

## Purpose

Turn repeated failures into durable capabilities instead of repeatedly patching symptoms.

## Contract

1. Record gap evidence from the exact failed run, job, step, and SHA.
2. Check the existing skill inventory for duplicates or overlapping capabilities before creating anything.
3. Define acceptance tests before promotion.
4. Preserve security and approval boundaries; reject or flag unsafe instructions.
5. Require actual CI evidence on the repaired SHA before promotion.
6. Keep candidates separate from promoted skills until acceptance tests pass.
7. Never claim improvement from a generated file alone.

## Promotion gate

Gap evidence -> non-duplicate check -> acceptance tests -> security review -> exact-SHA CI proof -> promotion.
