# Frontier Execution Implementation Evidence — 2026-09-25

## Scope
Evidence-gated executable frontier lifecycle restored on the current `main` baseline.

## Baseline
- Main commit: `19f4d7d299626dbf87710a770c9778cd3ad99863`

## Implementation
- `apps/control-plane/execution-loop.mjs`
  - stage transitions are explicit;
  - VERIFYING/PERSISTING/COMPLETED/FAILED require evidence;
  - SELECTED → FAILED is legal so executor failures preserve failure evidence;
  - external blockers are normalized and fail closed.
- `apps/control-plane/autonomous-frontier-runner.mjs`
  - connects selection to execution;
  - converts handler failures into FAILED with source evidence;
  - exposes NO_EXECUTABLE_FRONTIER;
  - recomputes discovery after each execution with a bounded iteration cap.
- Regression suites:
  - `test-execution-loop.mjs`
  - `test-autonomous-frontier-runner.mjs`
  - imported by `test-control-plane.mjs`.
- CI:
  - Reuses the repository's existing control-plane/closure CI instead of introducing a new workflow file.
  - This avoids creating an additional workflow-review gate for a test that is already covered by existing control-plane checks.

## Verification status
- Source contents were re-read from the PR branch after each write.
- GitHub PR: #84.
- Previous PR-merge test run 36191020657 executed 13/14 tests successfully and exposed one test fixture defect: PERSISTING requires evidence but the fixture supplied none.
- The fixture was corrected in commit `6100660c9ad18c5e4736f9458d749f45ffcefef2`.
- A fresh workflow run for the corrected head has not yet been observed through the connected workflow-run API; no fresh CI success is claimed.
- Local container execution remains unavailable for repository testing because the environment cannot resolve `github.com`.

## Integrity
No deployment, credentials, production mutation, merge bypass, or fabricated test result was used.
