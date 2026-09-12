---
name: failure-to-skill
description: Use after a failed execution or repeated workaround to decide whether the failure contains a reusable capability lesson. Convert repeatable failures into evaluation cases and new skill candidates.
---
# Failure to Skill

Treat failure as structured input.

Capture:
- task and desired outcome;
- attempted approaches;
- exact failure signal;
- root cause or uncertainty;
- workaround discovered;
- whether the problem is reusable.

Then:
1. Add a regression case when the failure is reproducible.
2. Check whether an existing skill should be repaired instead.
3. If the gap is genuinely new and reusable, hand it to `skill-factory`.
4. Benchmark the candidate against the failed baseline.
5. Preserve the failed path and lesson so the same failure becomes less likely later.

Do not manufacture a new skill for every isolated failure. Prefer a durable capability improvement.
