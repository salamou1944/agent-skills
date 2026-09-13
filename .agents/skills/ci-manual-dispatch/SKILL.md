---
name: ci-manual-dispatch
description: Safely prepare and validate GitHub Actions workflows for manual workflow_dispatch execution, including preflight checks, explicit workflow inputs, fail-closed behavior, and post-dispatch verification. Use when a repository needs a reliable human-triggered CI path because push-triggered Actions may not run.
---

# CI Manual Dispatch

## Purpose

Provide a deterministic, auditable path for a human or an authorized automation layer to start a GitHub Actions workflow manually and verify that the requested run actually started.

This skill prepares the repository-side contract. It does **not** claim to dispatch a workflow unless the executing tool has an explicit GitHub Actions `workflow_dispatch` capability.

## Preconditions

1. Target workflow exists under `.github/workflows/`.
2. Workflow contains `on.workflow_dispatch`.
3. Required push/pull-request triggers remain intact unless removal is explicitly requested.
4. YAML parses successfully.
5. Workflow job commands are deterministic and suitable for the selected branch/ref.
6. The caller has permission to dispatch the workflow.

## Procedure

### 1. Discover

Identify the exact workflow file and its workflow name. Do not guess the file from a display name alone.

### 2. Inspect

Verify the workflow contains:

```yaml
on:
  workflow_dispatch:
```

If inputs are required, document them explicitly under `workflow_dispatch.inputs` and validate them in the workflow before use.

### 3. Preflight

Before dispatching, verify:

- workflow file is present on the target ref;
- target ref exists;
- workflow syntax is valid;
- requested inputs are valid;
- no secret or credential is embedded in the dispatch request;
- the requested workflow is not already running when duplicate execution would be unsafe.

### 4. Dispatch boundary

Use an explicit GitHub Actions workflow-dispatch operation when the connected tool exposes one.

If the available integration does not expose dispatch, **stop at the boundary** and report `dispatch_unavailable`. Never simulate a run, fabricate a run ID, or report success from the existence of `workflow_dispatch` alone.

### 5. Verify

After a real dispatch, poll the workflow runs for the exact workflow/ref and confirm a new run exists. Record:

- workflow name;
- ref;
- run ID;
- run URL;
- status;
- conclusion when finished.

A successful dispatch request with no observable run must be classified as `dispatch_unverified`, not `passed`.

## Failure states

- `workflow_not_found`
- `workflow_dispatch_missing`
- `invalid_ref`
- `invalid_input`
- `preflight_failed`
- `dispatch_unavailable`
- `dispatch_unverified`
- `run_failed`
- `run_cancelled`
- `run_success`

## Safety rules

- Never bypass branch protections.
- Never inject credentials into workflow inputs.
- Never fabricate CI evidence.
- Never convert a local syntax check into GitHub Actions evidence.
- Preserve existing CI triggers unless the task explicitly requests a trigger change.
- Prefer a dedicated verification workflow when the production workflow is expensive or destructive.

## Expected output

Return a concise execution record containing:

```text
workflow: <name>
ref: <ref>
dispatch: dispatched | dispatch_unavailable | dispatch_unverified
run: <id or none>
status: queued | in_progress | completed | none
conclusion: success | failure | cancelled | none
```

The skill is complete only when both the repository-side manual-dispatch contract and the post-dispatch verification behavior are defined.