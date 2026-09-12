---
name: skill-factory
description: Use when the system discovers a reusable capability gap and needs to turn the gap into a new skill that did not previously exist. Generate a complete candidate skill, tests, provenance, and promotion evidence.
---
# Skill Factory

Create a new skill from a proven reusable gap.

1. Name the missing capability in one sentence.
2. Search the current inventory for semantic overlap; do not duplicate an existing skill.
3. Define the trigger and non-trigger boundary.
4. Define inputs, outputs, procedure, stop conditions, safety boundaries, and evidence requirements.
5. Generate the smallest complete `SKILL.md` candidate.
6. Generate acceptance cases covering success, failure, regression, and safety boundaries.
7. Run the candidate against the originating failure and a nearby task.
8. Compare baseline versus candidate.
9. Store the candidate as `candidate`, not `promoted`, until validation passes.
10. Promote only when measurable reusable capability is demonstrated.

The factory creates capability; it does not grant authority. New skills inherit the repository's security and approval boundaries.
