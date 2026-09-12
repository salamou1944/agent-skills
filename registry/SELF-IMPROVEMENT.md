# Self-Improvement Contract

This repository treats skills as an evolving capability system rather than a static collection.

## Control loop

`task -> capability map -> solution portfolio -> execution -> evaluation -> adversarial test -> gap detection -> candidate skill -> benchmark -> promotion/rejection`

## What may self-evolve

- new `SKILL.md` workflows
- evaluation cases
- deterministic helper scripts
- adapters and interfaces
- documentation and evidence records

## What may not self-evolve automatically

- authorization or access boundaries
- security validation rules
- secrets or credentials
- policy/safety controls
- claims of successful execution without evidence

## Candidate skill contract

Every generated candidate must contain:

1. unique name;
2. trigger-optimized description;
3. explicit inputs and outputs;
4. bounded procedure;
5. stop/failure conditions;
6. safety boundaries;
7. acceptance tests;
8. evidence of the gap it closes;
9. overlap analysis against existing skills;
10. before/after benchmark evidence.

## Promotion principle

A new skill is valuable only when it creates reusable capability or measurably improves an existing capability. More files are not an improvement by themselves.

## Learning principle

Failures are reusable training signals for the skill layer. A failure should either:

- improve an existing skill,
- create a new candidate skill,
- create a new evaluation case,
- or be classified as an external dependency that cannot be solved internally.

The system must never turn a failed execution into a false success claim.
