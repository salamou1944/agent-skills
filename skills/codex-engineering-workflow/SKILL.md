---
name: codex-engineering-workflow
description: Governs repeatable Codex-assisted software work from repository scoping and planning through bounded implementation, tests, review, and evidence-backed completion.
---

# Codex Engineering Workflow

## Purpose

Turn Codex-assisted coding into a controlled engineering workflow rather than an unbounded code-generation session.

## Procedure

1. Scope the repository, target files, task contract, constraints, and acceptance criteria before changing code.
2. Inspect existing architecture, conventions, tests, and relevant project instructions before implementation.
3. Plan the smallest coherent change; separate independent work and avoid unrelated cleanup.
4. Implement within the declared scope and preserve existing behavior unless the task explicitly changes it.
5. Run focused tests first, then broader deterministic verification appropriate to the change.
6. Review the diff for correctness, security, unintended scope expansion, configuration mistakes, and missing tests.
7. Record concrete evidence: commit/change set, tests executed, relevant outputs, runtime evidence when applicable, and unresolved risks.
8. Report completion only when the acceptance criteria are satisfied by evidence.

## Reusable workflow rules

- Convert recurring successful Codex procedures into project instructions or reusable Skills rather than relying on memory.
- Keep prompts/task specifications explicit about scope, inputs, tools, expected artifacts, and acceptance tests.
- Prefer reviewable checkpoints for long-running or multi-file work.
- When using automation or headless execution, preserve logs and make failures observable.
- Re-run the smallest relevant regression set after remediation.

## Safety and authorization

- Do not bypass authentication, MFA, quotas, rate limits, repository protections, or provider safety controls.
- Do not expose secrets or grant unrestricted destructive access merely to simplify execution.
- Do not merge, deploy, delete, or make other irreversible changes without the authorization required by the project.
- A Codex claim of success is not execution proof; repository and runtime evidence remain authoritative.

## Done

The workflow is complete only when the intended change is reviewable, deterministic verification has been run, and the evidence is recorded.
