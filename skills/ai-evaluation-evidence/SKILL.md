---
name: ai-evaluation-evidence
description: Provider-neutral evaluation, benchmarking, observability, and regression verification for AI applications and agents using explicit metrics, datasets, rubrics, traces, and evidence.
---

# AI Evaluation Evidence

## Purpose

Turn AI application and agent evaluation into a repeatable evidence-producing engineering loop rather than subjective spot checks.

## Workflow

1. Define the system under test, task contract, expected behavior, and risk boundaries.
2. Build representative evaluation cases from real, synthetic, and adversarial inputs when appropriate.
3. Select measurable quality, correctness, safety, latency, cost, tool-use, and reliability metrics relevant to the task.
4. Define a reproducible rubric and acceptance thresholds before reviewing results.
5. Run controlled evaluations and preserve inputs, outputs, evaluator configuration, model/provider/version, timestamp, and execution metadata.
6. Inspect tool selection, tool inputs, tool outputs, failures, abstentions, grounding, completeness, and other task-specific signals when the system is agentic.
7. Compare variants using the same evaluation set and record regressions as well as improvements.
8. Feed failures into remediation and rerun the relevant regression cases.
9. Reject ambiguous or missing evidence; never report a passing evaluation from an unverified sample.

## Evidence contract

Each evaluation should record:
- system/version under test
- evaluation dataset or case identifiers
- expected outcome/rubric
- model/provider/version where applicable
- metrics and thresholds
- execution timestamp
- observed result
- evaluator configuration
- failures/regressions
- remediation
- retest result
- limitations/confidence


## Agent reliability signals
For agent systems, include operational checks in the evidence loop:
- verify agent/skill backup and restore behavior in an isolated test fixture;
- verify status/observability output exposes the expected agent and skill state;
- treat these as regression evidence, not as permission to mutate production state;
- preserve the test fixture, observed result, and retest result alongside the evaluation record.

These checks strengthen reliability evidence and should be merged into an existing evaluation Skill rather than creating a duplicate Skill when the capability is already covered by evaluation/observability workflows.

## Provider-neutral boundary

The Skill does not require a particular model vendor, cloud, evaluator, or tracing product. Provider-specific evaluators may supply measurements, but the acceptance contract remains owned by the project.

## Safety

Use only authorized systems and datasets. Do not bypass authentication, quotas, rate limits, safety controls, privacy boundaries, or provider protections. Do not include secrets or private data in evaluation fixtures or logs unless explicitly authorized and protected.

## Done

An evaluation is complete only when the acceptance criteria are defined, the test evidence is reproducible, failures are recorded, and required regressions are retested.
