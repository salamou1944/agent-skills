---
name: repair-acceleration
description: Accelerate evidence-driven repository repair by turning failures into targeted context, minimal patches, regression checks, and persisted provenance.
---

# Repair Acceleration

Use this skill when a repository has a concrete failing test, workflow error, runtime error, or verification gap.

## Loop

1. Capture the exact failing command, job, commit, and failure output.
2. Search the repository for the failing symbol, error, test, route, and configuration.
3. Build the smallest dependency/context set around the failure before editing.
4. Classify the root cause: code, test, configuration, dependency, infrastructure, security/review gate, or external provider.
5. Patch the smallest reversible surface.
6. Run the narrowest regression first, then the repository-native verification suite.
7. Require task-specific acceptance evidence; infrastructure green alone is not completion.
8. Persist commit SHA, verification result, remaining blocker, and provenance.

## Reuse rules

- Prefer existing repository-native scripts and tests over introducing a second framework.
- Reuse existing evidence/state-machine semantics.
- Never weaken fail-closed gates, remove tests, bypass authentication/quotas, or convert an external blocker into success.
- Treat PIPELINE_VERIFIED as infrastructure evidence only; never promote it to TASK_VERIFIED.
- Keep project boundaries separate.

## External blocker handling

An external blocker is valid only when a concrete probe or provider response proves that the current code cannot proceed because of an unavailable external capability. Record the probe, provider, exact failure class, and the strongest successful local regression.

## Output contract

Machine-readable results must contain at least:
- status
- root_cause_class
- evidence
- commit_sha
- verification
- blocker
- provenance

Human-readable status belongs on stderr; machine-readable JSON belongs on stdout.
