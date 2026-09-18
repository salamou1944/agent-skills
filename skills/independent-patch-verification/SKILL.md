---
name: independent-patch-verification
description: Independently reconstruct the issue a patch appears to solve, reconcile it against the stated requirement, and block completion when the patch's behavior does not align with the requested repair.
---

# Independent Patch Verification

## Purpose

Do not let the same reasoning path that generated a patch be the only evidence that the patch is correct.

Use this skill after implementation and before task completion. It adds an independent semantic check on top of tests, linting, type checks, and artifact inspection.

## Contract

`issue → patch → forward reconstruction → blind backward reconstruction → reconciliation → targeted verification → PASS|REPAIR|BLOCKED`

## Procedure

1. **Freeze the candidate**
   - Capture the exact issue/requirements, base revision, candidate revision, changed-file list, and verification outputs.
   - Do not mutate the candidate during reconstruction.

2. **Forward reconstruction**
   - From the requirement and agent trajectory, write a short expected-repair statement.
   - Identify acceptance predicates that must become true.
   - Separate explicit requirements from assumptions.

3. **Blind backward reconstruction**
   - Ignore the original issue text and infer what problem the patch appears to address using only the patch, affected code, tests, and observable behavior.
   - Record the inferred problem and the evidence supporting it.
   - Do not use the forward reconstruction as context.

4. **Reconcile**
   - Compare the forward and backward problem statements.
   - Check scope, affected behavior, edge cases, and acceptance predicates.
   - Classify:
     - `ALIGNED`: same problem and materially matching behavior.
     - `PARTIAL`: related problem but missing or extra behavior.
     - `MISALIGNED`: patch appears to solve a different problem.
     - `INCONCLUSIVE`: evidence is insufficient.

5. **Targeted verification**
   - For ALIGNED/PARTIAL candidates, run the smallest deterministic checks that exercise the disputed behavior.
   - Prefer regression tests that fail on the pre-patch revision and pass on the candidate.
   - Add adversarial cases for boundary conditions and plausible regressions.
   - Never treat a passing test suite as proof of semantic alignment by itself.

6. **Decision**
   - `PASS` only when semantic reconciliation is ALIGNED and task-specific verification passes.
   - `REPAIR` when PARTIAL or a verification failure gives actionable repair evidence.
   - `BLOCKED` when required evidence cannot be obtained safely or deterministically.
   - `FAIL` when MISALIGNED or the candidate violates a hard acceptance/security condition.

## Evidence record

Emit machine-readable evidence containing at least:

```json
{
  "verification": "independent-patch",
  "baseRevision": "<sha>",
  "candidateRevision": "<sha>",
  "alignment": "ALIGNED|PARTIAL|MISALIGNED|INCONCLUSIVE",
  "forwardProblem": "<short statement>",
  "backwardProblem": "<short statement>",
  "acceptancePredicates": ["..."],
  "checks": [{"name": "...", "status": "PASS|FAIL|BLOCKED"}],
  "decision": "PASS|REPAIR|BLOCKED|FAIL"
}
```

Do not include secrets, credentials, private tokens, or sensitive payloads.

## Integration with Elite

Run this gate after implementation and before promoting `TASK_VERIFIED`.

Recommended Elite sequence:

`INTAKE → RETRIEVE → PLAN → EXECUTE → OBSERVE → VERIFY → INDEPENDENT-PATCH-VERIFY → REPAIR|CHECKPOINT → CONTINUE → COMPLETE`

The gate is complementary to tests and adversarial review; it is not a replacement for them.

## Failure rules

- Never infer correctness from a green CI result alone.
- Never allow the generating agent to author both sides of the independent reconstruction.
- Never silently widen the task to make a patch appear aligned.
- Never promote `PIPELINE_VERIFIED` to `TASK_VERIFIED` without task-specific evidence.
