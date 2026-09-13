---
name: ci-dispatch-runner
description: Dispatch real GitHub Actions workflows with explicit refs and hand exact run evidence to verification.
---

# CI Dispatch Runner

## Purpose
Execute a real GitHub Actions `workflow_dispatch` from an environment that has an authorized GitHub CLI (`gh`) session, then hand the run to verification. This skill closes the execution gap left by repository-side configuration checks.

## Preconditions
- Exact workflow file and workflow identifier are known.
- Target ref is explicit.
- `workflow_dispatch` exists in the workflow.
- `gh auth status` succeeds with Actions write permission.
- Inputs, if any, are explicitly supplied and validated.
- No credentials are written to files or committed to the repository.

## Procedure
1. Resolve the exact workflow and target ref.
2. Run repository/workflow preflight.
3. Confirm `gh auth status` and required permission before dispatch.
4. Dispatch with `gh workflow run <workflow> --ref <ref>`; pass only approved inputs.
5. Capture the dispatch timestamp and target ref.
6. Locate the newly created run for the same workflow/ref after dispatch; never reuse an older run.
7. Hand the exact run ID to `ci-run-verifier`.
8. Return the verifier's final conclusion.

## Safety
- Never fabricate a run ID, URL, status, or conclusion.
- Never treat a configured `workflow_dispatch` trigger as evidence that a run happened.
- Never fall back to an ordinary push merely to simulate manual dispatch.
- If `gh` or Actions write permission is unavailable, return `dispatch_unavailable` and stop.

## Failure states
`workflow_not_found`, `workflow_dispatch_missing`, `invalid_ref`, `invalid_input`, `auth_unavailable`, `permission_unavailable`, `dispatch_failed`, `dispatch_unverified`, `run_failed`, `run_cancelled`, `run_success`

## Required output
```text
workflow: <workflow>
ref: <ref>
dispatch: dispatched | dispatch_unavailable | dispatch_failed | dispatch_unverified
run: <id or none>
status: queued | in_progress | completed | none
conclusion: success | failure | cancelled | none
```
