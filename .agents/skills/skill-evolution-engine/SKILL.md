---
name: skill-evolution-engine
description: Use when an execution repeatedly fails, a task exposes a reusable capability gap, or an existing skill underperforms. Derive, validate, and package a new skill from the observed failure instead of merely patching the current task.
---
# Skill Evolution Engine

Turn operational evidence into new reusable capability.

1. Capture the failed task, attempted paths, observed failure, and missing capability.
2. Confirm the gap is reusable rather than a one-off data or access problem.
3. Search the existing skill inventory for overlap.
4. Design the smallest new skill that closes the gap; prefer composition over duplication.
5. Write a precise trigger, procedure, inputs/outputs, stop conditions, safety boundaries, and acceptance tests.
6. Run the new skill against the original failure and at least one nearby task.
7. Compare baseline versus improved results using the same metrics.
8. Reject the candidate if it adds no measurable capability, duplicates an existing skill, or introduces unsafe behavior.
9. If it passes, register it as a candidate and preserve provenance/evidence for promotion.

A failed task becomes a learning event, not an excuse for uncontrolled self-modification.

The engine may create a new skill specification, test, script, or adapter. It must never silently rewrite security policy or grant itself new authority.
