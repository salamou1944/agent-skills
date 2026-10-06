---
name: execution-operating-layer
description: Operate an evidence-first execution loop that selects a canonical Skill, binds authorized resources/providers, executes through the existing control plane, independently verifies the outcome, persists evidence, classifies recovery, and records the business or engineering outcome without creating a second orchestration system.
---

# Execution Operating Layer

## Objective

Turn a reusable Skill into a bounded, observable execution with a verifiable outcome.

The layer is an operating contract over existing components, not a replacement for Elite, ARMY-14, SOAT, MCP, provider gateways, or project-specific runtimes.

## Canonical loop

`DISCOVER → SELECT → AUTHORIZE → BIND RESOURCES → EXECUTE → VERIFY → PERSIST EVIDENCE → CLASSIFY OUTCOME → RECOVER/REPLAN`

For recurring work, the next cycle may begin only from persisted, verified state.

## Required execution record

Every material run must identify:

- task/request identifier;
- selected canonical Skill and revision;
- source/provenance;
- authorization scope;
- bound resources/tools/providers and revisions where relevant;
- execution mode and start/end timestamps;
- expected acceptance criteria;
- actual result;
- independent verification result;
- evidence/artifact references;
- failure/recovery classification;
- business or engineering outcome;
- next-action/replan decision.

## Selection rules

1. Prefer an existing canonical Skill over creating a new procedure.
2. Deduplicate against `agent-skills` before promotion.
3. Do not treat discovery metadata as runtime availability.
4. Require configured, authorized, reachable resources before execution.
5. Select the smallest Skill that closes the task gap.
6. Do not import an external framework/control plane when a bounded procedure is sufficient.

## Execution rules

- Use the existing execution/control plane and project runtime.
- Enforce least-privilege authorization.
- Fail closed when authorization, required resource, or acceptance criteria are missing.
- Make side effects idempotent where practical.
- Use bounded retries and explicit recovery states.
- Never mark success from transport health alone.

## Verification rules

Verification must be independent of the action that produced the result whenever practical.

Distinguish:

- infrastructure healthy;
- operation executed;
- expected artifact/result exists;
- acceptance criteria satisfied;
- downstream/business outcome observed.

A successful API call, queue acknowledgement, CI green check, or provider reachability signal is not by itself task completion.

## Evidence rules

Persist enough evidence to reproduce the claim:

- exact revision/inputs;
- observed output;
- verifier and verification time;
- artifact or endpoint reference;
- relevant logs/checksums;
- unresolved limitations.

Use the existing SOAT/evidence mechanisms and `AI_operating_memory`; do not create a competing evidence store.

## Outcome rules

Classify the terminal result as one of:

`VERIFIED_OUTCOME`, `VERIFIED_PARTIAL`, `BLOCKED_EXTERNAL`, `FAILED_EXECUTION`, `VERIFICATION_FAILED`, `REVIEW_REQUIRED`.

For commercial tasks, separately record:

`DISCOVERED → ENTRY_POINT_VERIFIED → USAGE_OBSERVED → CUSTOMER_ACTION_OBSERVED → REVENUE_OBSERVED → PAYOUT_OBSERVED`

Never infer revenue from configuration, availability, clicks, or a successful technical run.

## Recovery and replanning

When execution fails:

1. preserve the failure evidence;
2. classify whether the cause is Skill, authorization, resource/provider, runtime, data, or verification;
3. retry only when the failure is retryable and the retry is bounded;
4. repair or substitute the smallest failing component;
5. re-run the independent verifier;
6. persist the new evidence;
7. replan only from the verified current state.

Do not hide failures by changing status flags.

## Boundaries

This Skill does not:

- become a new agent framework;
- replace Elite/ARMY-14;
- replace SOAT;
- replace provider routing/API infrastructure;
- grant unrestricted shell, browser, network, credentials, deployment, or payment authority;
- treat COLLECTION records as executable proof.

## Completion gate

A task is complete only when task-specific acceptance evidence exists and the result is persisted and traceable. Otherwise report the exact maturity state and blocker.
