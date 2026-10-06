---
name: ai-evaluation-evidence
description: Provider-neutral evaluation, benchmarking, observability, regression verification, RAG quality, model comparison, and cost/latency/reliability evidence for AI applications and agents.
---

# AI Evaluation Evidence

## Purpose

Turn AI application and agent evaluation into a repeatable evidence-producing engineering loop rather than subjective spot checks.

## Workflow

1. Define the system under test, task contract, expected behavior, and risk boundaries.
2. Build representative evaluation cases from real, synthetic, and adversarial inputs when appropriate.
3. Select measurable quality, correctness, safety, latency, cost, tool-use, retrieval, and reliability metrics relevant to the task.
4. Define a reproducible rubric and acceptance thresholds before reviewing results.
5. Run controlled evaluations and preserve inputs, outputs, evaluator configuration, model/provider/version, timestamp, and execution metadata.
6. Inspect tool selection, tool inputs, tool outputs, failures, abstentions, grounding, completeness, retrieval behavior, and other task-specific signals when the system is agentic or retrieval-augmented.
7. Compare variants using the same evaluation set and record regressions as well as improvements.
8. Feed failures into remediation and rerun the relevant regression cases.
9. Reject ambiguous or missing evidence; never report a passing evaluation from an unverified sample.

## Evaluation Fixture Contract

For reusable machine-readable evaluations, use the provider-neutral `evaluation-fixture/v1` contract when the project adopts it. Preserve dataset/corpus revision, system commit, model/configuration, rubric and thresholds, run metadata, raw/artifact references, failures, invalid cases, and comparison/regression status. Keep credentials and secrets out of fixtures. The contract standardizes evidence shape; it does not by itself prove that an evaluation was executed.

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
- benchmark/fixture provenance and revision when external or versioned datasets are used

## RAG evaluation

For retrieval-augmented systems, separate retrieval quality from generation quality.

Measure, where applicable:
- retrieval recall/coverage against known relevant sources;
- precision or relevance of retrieved chunks;
- ranking quality and duplicate/noise rate;
- citation/source grounding and attribution correctness;
- answer faithfulness to retrieved evidence;
- completeness for multi-source questions;
- abstention behavior when evidence is insufficient;
- latency and cost by retrieval stage and generation stage.

Keep retrieval fixtures, corpus revision, chunking/index configuration, query set, and expected relevant sources fixed when comparing variants. A good final answer does not prove retrieval quality by itself.

## Model and benchmark provenance

When comparing models, prompts, retrieval configurations, or agent variants:
- keep the task set and acceptance rubric stable where the comparison requires it;
- record exact model/version, configuration, tools, prompt/instruction revision, dataset revision, and run count;
- preserve raw outputs and evaluator results sufficient to reproduce or audit the claim;
- distinguish benchmark results from production outcomes;
- do not publish a benchmark claim from an incomplete, cherry-picked, or uncommitted fixture;
- report invalid, missing, or inconsistent evaluation cases rather than silently dropping them.

## Cost, latency, and reliability optimization

Treat optimization as an evidence-backed comparison, not an assumption.

For a candidate change:
1. establish a baseline on the same representative cases;
2. measure quality/correctness alongside latency, token or usage cost, tool calls, retries, and failure rate;
3. compare p50/p95 or other appropriate latency distributions rather than a single average when tail behavior matters;
4. identify stage-level bottlenecks before optimizing;
5. reject an optimization that improves cost or latency while violating acceptance thresholds;
6. retest regressions after the change and retain the comparison evidence.

Use model routing, caching, batching, prompt/context reduction, retrieval tuning, or tool-call reduction only when the measured workload and constraints justify them.

## Agent reliability signals

For agent systems, include operational checks in the evidence loop:
- verify agent/skill backup and restore behavior in an isolated test fixture;
- verify status/observability output exposes the expected agent and skill state;
- treat these as regression evidence, not as permission to mutate production state;
- preserve the test fixture, observed result, and retest result alongside the evaluation record.

These checks strengthen reliability evidence and should be merged into an existing evaluation Skill rather than creating a duplicate Skill when the capability is already covered by evaluation/observability workflows.

## Provider-neutral boundary

The Skill does not require a particular model vendor, cloud, evaluator, tracing product, vector database, or retrieval framework. Provider-specific evaluators may supply measurements, but the acceptance contract remains owned by the project.

## Safety

Use only authorized systems and datasets. Do not bypass authentication, quotas, rate limits, safety controls, privacy boundaries, or provider protections. Do not include secrets or private data in evaluation fixtures or logs unless explicitly authorized and protected.

## Done

An evaluation is complete only when the acceptance criteria are defined, the test evidence is reproducible, failures are recorded, and required regressions are retested.
