---
name: background-engineering-loop
description: Use when engineering work must continue across sessions through a scheduler, durable state, bounded retries, verification, and evidence; never pretend the model is executing after a turn ends.
---
# Background Engineering Loop

Turn ongoing engineering work into a durable, externally triggered loop. This skill does not create autonomous execution inside the model; it defines the contract that a scheduler/runner must invoke.

## Mission

Given a repository and an engineering objective, repeatedly advance the objective without losing state between runs.

## Execution contract

Each invocation MUST:
1. Load the durable task state and repository ref.
2. Inspect current repository, open PRs, recent CI, and recorded blockers.
3. Select exactly one highest-value unblocked action.
4. Make the smallest safe change or diagnostic step.
5. Run deterministic tests and relevant security checks.
6. Verify CI when the change requires CI evidence.
7. Persist evidence, commit/ref, result, and next action.
8. Exit with a bounded result; never claim background execution beyond the current invocation.

## State machine

Use only these states:
- `READY`: work can proceed.
- `RUNNING`: one bounded invocation is active.
- `BLOCKED`: an external dependency, permission, unavailable tool, or required approval prevents progress.
- `VERIFYING`: implementation exists but evidence is incomplete.
- `SOLVED`: product-proof requirements are satisfied.

A state transition to `SOLVED` requires implementation, positive integration coverage, failure coverage, security proof, and CI evidence where applicable.

## Retry discipline

- Persist an attempt counter and last failure fingerprint.
- Retry transient failures only up to a configured limit.
- If the same failure repeats, stop retrying blindly and invoke diagnosis/capability-gap analysis.
- Never loop indefinitely.
- Never fabricate a CI run, provider result, commit, or successful verification.

## Capability escalation

When blocked, classify the missing capability as one of: skill, script, API/tool, permission, workflow, provider, code defect, or user approval. Build the smallest missing capability when it is safe and available; otherwise persist the exact blocker.

## Scheduler boundary

A scheduler or external runner is responsible for invoking this skill periodically. The skill MUST treat every invocation as a fresh process and rely on durable state rather than conversational memory. It must not imply that the model remains alive between invocations.

## Required output

```text
state: READY | RUNNING | BLOCKED | VERIFYING | SOLVED
action: <single action performed>
result: <observable result>
evidence: <tests/CI/security/commit evidence>
blocker: <none or exact blocker>
next_action: <single next action>
attempt: <number>
```

## Safety rules

- No destructive operation without explicit authorization.
- Do not bypass Code Guardian, security proof, product proof, or approval gates.
- Do not treat environment variables as proof of provider readiness.
- Do not silently modify unrelated files.
- Prefer reversible changes and auditable commits.
