# RECOVERED-CONTEXT-LEDGER

> Durable engineering continuity ledger. This file contains architecture, operating constraints, verified state, blockers, and recovery references. It never stores credentials, tokens, passwords, API keys, live affiliate URLs, or other secrets.

## Source-of-truth boundaries

- `salamou1944/agent-skills`: control-plane / engineering core; canonical reusable skills, Elite execution, ARMY-14 verification, EASY runtime, and MONY execution code.
- `salamou1944/AI_operating_memory`: canonical machine-readable cross-repository project-state store.
- `salamou1944/Easy-`: EASY product repository.
- `salamou1944/Salamou-31`: AI/API hub and AI Product Content API.
- EASY, MONY, ELITE, ARMY-14, Evolution Lab, and Control Plane remain logically isolated. Cross-project changes require explicit dependency evidence.

## Operating rules

- Execute Detect -> Inspect -> Reproduce -> Root Cause -> Patch -> Regression -> Verify -> Impact Check -> Observe -> Persist -> Continue.
- Never claim success from mocks, historical evidence, pipeline green state, health alone, or provider reachability.
- Keep source, contract, unit, integration, runtime, provider, E2E, and business verification separate.
- Real provider failure must remain an explicit failure/block; never convert it into fake success.
- Security gates fail closed. Secrets never enter Git.
- Smallest safe patch first; preserve rollback/recovery paths.
- Important progress must be recoverable from Git, tests, CI, deployment state, evidence, queues, and checkpoints rather than conversation memory.

## MONY / Revenue Engine

- Continuity keyword: **mony**.
- Architecture: discover -> verify -> score -> route -> package -> publish -> measure -> learn.
- Revenue evidence ladder: configured -> reachable -> click_observed -> signup_observed -> conversion_observed -> commission_confirmed -> payout_confirmed.
- Only provider-confirmed commission/revenue events count as revenue.
- Never fabricate leads, replies, customers, payments, conversions, commissions, payouts, or recurring revenue.
- Initial acquisition target: Europe + Americas.
- Active monetization surfaces include affiliate, digital product, API, micro-SaaS, and data/opportunity paths.
- ElevenLabs affiliate configuration is external state; its live URL is intentionally not stored here.
- Canonical MONY machine state lives in `AI_operating_memory/PROJECT-STATE-MONY-CANONICAL.json`.

## EASY

- Product/runtime surfaces: Gateway, Operator, Creative, Creative Job, Customer/Auth, Revenue.
- Internal readiness must be reported separately from external provider capability.
- Current Railway developer runtime service: `easy-platform-runtime-v3` in project `EASY Developer Platform`, production environment.
- Latest verified runtime commit: `de75967c06ad166bca3b83f87d321941c7286a83` (fixed runtime E2E project path to match the isolated `.elite/e2e-runtime` workspace).
- Latest deployment evidence: Railway deployment `b36bf611-1cb9-4159-82e9-e97cf19e592b` succeeded from that commit; runtime logs show gateway/customer/auth/background services starting successfully and gateway/customer health checks returning 200.
- Runtime smoke currently proves platform/operator/creative/customer/revenue/dashboard/public gateway health and provider-readiness wiring.
- Current external blocker: real OpenAI image generation reaches the provider but is blocked by HTTP 429 / `credit_balance_exhausted`. The runtime now records this as `BLOCKED_EXTERNAL_PROVIDER`, not success.
- Guardian/security E2E now classifies embedded-secret detection as `BLOCKED`; the boot smoke also verifies the blocked path.
- EASY customer persistence and login health are runtime-verified through Supabase-backed auth evidence.

## ELITE

- Elite is the autonomous software-engineering execution/verification layer.
- Core lifecycle: understand -> plan -> execute -> verify -> recover -> record -> handoff.
- Provider ladder includes explicit failure classification and Copilot fallback where configured.
- Workspace Guardian must scan source files before provider execution and fail closed on detected secrets.
- Recent verified hardening commits:
  - `7136c0264c0ed6fcae7299713d121624b6f3912c`: stdin-based Copilot prompt to avoid E2BIG.
  - `0593ad50a01161ef8e8049364c34cde1ff62568e`: deterministic metric delta rounding.
  - `d08bd06e2a21be7452732ddf77016f7d909fba11` and `3c711d6c28701c5ff0f84bcb0c1b3b9def2a150d`: EASY GitHub token propagation and regression coverage.
  - `c174a7d36882352f812f07b9f8e7f3c50d24cca8`, `4aa2841166d9adf1ea9d5d0784f3ab801fa42078`, `cc19ed0490e77bbc11916f3935a167a312307b69`, `70060598ad6a24bbc9676463edc9593d264f1776`: Guardian implementation and regression hardening.
- Current Guardian import defect was fixed in `b59ba34cef89be955ab23b58537faadf9a75609a`.

## ARMY-14

- Canonical roster: 14 bounded soldier systems in `.github/agents/`.
- Each soldier has bounded scope, explicit state machine, evidence, recovery, checkpoint, rollback-or-safe-stop, and handoff invariants.
- Director completion bug fixed in `a47a2739994456a8a4b94dc3f501f9420d138e28`: transition verifying -> completed before final soldier verification.
- Syntax-diagnostic preservation in the practical runner fixed in `7d98623de5a2f15d908e8d318c6cb7f88f2b01ab`.
- A separate legacy Railway ARMY-14 worker remains pinned to commit `648e7a809c5a3cae2da34519b39a32909aef0902`; its historical source contains a syntax error in `elite-deployment-recovery.mjs`. A fresh redeploy was attempted at 2026-09-19 15:36Z and Railway again selected the same stale commit, so this is confirmed source/deployment drift rather than a current-main source failure. The redeploy remained BUILDING during observation. Available controls still do not expose a safe repoint of that service to current `main`; replacement service creation was previously blocked by Railway Free-plan resource limits.
- Do not interpret that legacy worker's failure as failure of the current ARMY-14 source; treat it as a deployment/source-drift blocker.

## Railway

- Current developer runtime: project `778678c6-dd6e-40fe-a33e-63d0953ab7d4`, production environment `ae3d2189-2aa5-4c5e-8ee8-9bfdc45dc2a4`, service `721280c9-8045-4bcb-a932-3455866bae2b`.
- Current developer runtime deployment is successful and tracked against `main`.
- Legacy EASY Runtime Production contains separate stale services; do not delete them without dependency evidence.
- A Railway Agent attempt to reconcile the stale ARMY-14 service was unavailable because the Railway Agent usage limit was reached.
- Creating a replacement ARMY-14 service was blocked by the Railway Free-plan resource provision limit.

## Salamou-31 / AI Product Content API

- Latest known main commit: `cd6f6b7443617d0cbd6f053c366d72e669ea2910`.
- Persistent idempotency ledger, retry-safe generation, credential/temp-artifact hygiene, and API regression workflow are present.
- Revenue/business claims still require live provider/customer evidence; local tests are not revenue evidence.

## AI Operating Memory / Evolution

- Latest known main commit: `7cfe0c9258cd897c105150c187b2853345b5f71e`.
- Evolution Frontier is executable and evidence-gated; experiment records and promotion boundaries are enforced.
- Evolution changes must prove Problem -> Evidence -> Change -> Test -> Failure behavior -> Rollback -> Measurement.

## Current verified blockers

1. EASY real image generation: external OpenAI credit exhaustion (HTTP 429 / `credit_balance_exhausted`).
2. Legacy Railway ARMY-14 worker: source/deployment drift; current toolset cannot repoint the existing service, and replacement provisioning is blocked by Free-plan resource limits.
3. Live MONY revenue: no provider-confirmed commission/payout evidence has been established by this ledger; configuration/reachability alone is insufficient.
