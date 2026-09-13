# CI Run Verifier

## Purpose
Verify that a specific GitHub Actions workflow run actually executed and determine its real conclusion, including job/step evidence and logs for failures.

## Preconditions
- Repository, workflow, ref, and exact run ID are known.
- The run ID was obtained after a real dispatch or trigger; it must not be invented.

## Procedure
1. Fetch the workflow run metadata.
2. Confirm workflow identity and target ref.
3. Inspect jobs and their conclusions.
4. If failed or cancelled, inspect failed job steps and logs.
5. Report the exact run URL, status, conclusion, failed job/step, and evidence.

## Safety
- Never infer success from workflow configuration.
- Never infer success from a previous run.
- Never report a run as verified without an exact run ID.
- Distinguish `queued`, `in_progress`, and `completed`.

## Required output
```text
workflow: <workflow>
ref: <ref>
run: <id>
status: queued | in_progress | completed
conclusion: success | failure | cancelled | none
failed_step: <name or none>
evidence: <concise evidence>
```
