# Recovered Context Ledger

Purpose: durable recovery of important ideas, decisions, boundaries, and operating rules recovered from prior conversations. This is a recovery aid, not a substitute for live repository/runtime evidence.

## Recovery rules
- Treat prior conversation as provenance for ideas and decisions, not proof that implementation still exists.
- Before acting, resolve exactly one canonical project/artifact scope.
- Extract atomic facts; deduplicate; compare with current repository/runtime evidence.
- Preserve conflicts and uncertainty instead of silently choosing a version.
- Never promote status from memory alone.
- If an artifact or decision cannot be mapped to an owning project, keep it as RECOVERY_CANDIDATE until resolved.
- New discoveries should be appended with provenance rather than replacing historical context.

## User operating rules recovered
- Do not wait for the user to choose routine execution decisions; independently research, extract value, implement useful changes, test, repair, and verify.
- Do not send interim messages when the user explicitly asks to return only after completion.
- Search for problems first; use measurable evidence; do not overclaim.
- External projects are sources of lessons, patterns, capabilities, and mistakes; do not blindly copy proprietary code.
- Keep project state separated even when workflows or technologies overlap.
- Do not call something complete, fixed, live, production-ready, or stronger than another system without the corresponding evidence.
- Preserve working behavior when strengthening existing products.
- Security work remains defensive and authorized.

## Recovered project map

### EASY
Owner/scope: `salamou1944/Easy-` + EASY runtime.
Purpose: Algeria-first commerce product and seller/customer operations.
Architecture direction: PRODUCT -> Product DNA -> Integrity -> Creative -> Seller Review -> Order -> Delivery -> Analytics -> Learn.
Product-truth principle: understand real product -> protect identity -> transform presentation -> verify result.
Important constraints: preserve existing Seller Flow; Product DNA before integrity/creative; preserve product colors/text/logo/product letters; mark unknowns; separate immutable vs flexible attributes; no external image/video generation in the initial Creative Engine.
Customer demo: Demo Mode -> Seller Profile/Store -> Upload/Sample -> EASY Magic -> Creative Review -> Confirm/Download.
Known demo fixtures: Leather Bag, Thermal Bottle, Desk Lamp.
Production gaps previously identified: real provider, durable persistence, auth/authz, deployed E2E, Seller->Order->COD->Delivery, analytics/live proof.
Boundary: EASY must not own MONY/revenue-engine state.

### MONY / Revenue Engine
Canonical machine-readable state: `salamou1944/AI_operating_memory`.
Purpose: fast online-income system targeting realistic first revenue and scaling toward ~$2000, with Europe/US focus.
Architecture: discover -> verify -> score -> route -> package -> publish -> measure -> learn.
Models considered: affiliate offers, digital products, APIs, micro-SaaS, opportunity/data products.
Customer-facing principle: a company should be able to inspect a real demo before a pilot/revenue transition.
Demo flow: Company -> Opportunity/Scenario -> Discover -> Verify -> Score -> Economic Analysis -> Route/Package -> Execute -> Track -> Evidence -> Learn.
Affiliate state: PartnerStack live postback bridge was connected through EASY runtime because a separate Railway service was unavailable on the free plan; real reward evidence is required, and revenue lifecycle must distinguish pending/approved/available/paid with dedupe and monitoring.
GPU rental analysis: a recovered MONY idea around GPU brokerage, aggregation/arbitrage, managed infrastructure, or marketplace without owning GPUs. Keep as IDEA unless a later decision promotes it.
Boundary: MONY revenue state is not EASY state.

### ELITE
Owner/scope: `salamou1944/agent-skills`.
Purpose: autonomous coding/engineering capability.
Engineering contract: requirements -> inspect -> design -> implement -> test -> adversarial review -> repair -> verify -> evidence.
Autonomous loop: INTAKE -> RETRIEVE -> PLAN -> EXECUTE -> OBSERVE -> VERIFY -> REPAIR|CHECKPOINT -> CONTINUE -> COMPLETE.
Important hardening: independent patch verification; independent evidence gate; patch fingerprint binding; benchmark ground-truth/hidden-eval leakage guards; retrieval precision/recall/F1 and abstention; explicit fault matrix; process-discipline metrics.
Current known blocker from recent queue evidence: defect-closure was BLOCKED by all_providers_exhausted / primary provider HTTP 429. Empty workflow/status results are not CI success.
Boundary: Elite is engineering capability, not ARMY-14 field identity.

### ARMY-14
Scope: multi-agent execution/verification field architecture in `agent-skills`.
Contract: pipeline verification is not task verification.
Field exercise semantics: 14 soldiers may be pipeline-verified while taskVerified remains false; provider access may be not required for the pipeline gate; revenue must not be claimed from a field exercise.
Boundary: ARMY-14 and Elite are related but distinct artifacts.

### CONTROL_PLANE / agent-skills
Scope: engineering/control-plane source of truth, reusable skills/tooling, verification, security.
Rules: inspect before change; PR-only project writes; fail-closed authorization; evidence required before completion; task evidence separate from pipeline health; no secrets/tokens committed.
Recent organization work: repository structure, MONY state projection, README, and project boundaries were documented.
Boundary: control-plane health must not be mistaken for product-specific completion.

### SALAMOU-31
Scope: `salamou1944/Salamou-31`.
Purpose: AI/API hub and sellable API services.
Known product direction: AI Product Content API MVP with quota ledger hardening and tests.
Boundary: do not infer EASY or MONY ownership from shared AI/API concepts.

## Verification/evidence vocabulary
IDEA -> DECISION -> IMPLEMENTED -> TEST_VERIFIED -> TASK_VERIFIED -> DEPLOYED -> LIVE_VERIFIED -> HUMAN_TRIAL_READY -> PRODUCTION_READY.
BLOCKED overrides promotion when required evidence is missing or contradictory.
PIPELINE_VERIFIED != TASK_VERIFIED.
TEST_VERIFIED != LIVE_VERIFIED.
Demo != production proof.
CI != live-runtime proof.
Deployment metadata != proof that the intended revision is live.
Conversational recollection != repository/runtime evidence when they conflict.

## Recovered research-derived principles
- Coding-agent evaluation must measure process discipline, not only final outcome; relevant dimensions include planning fidelity, verification coverage, recovery efficiency, abstention quality, and atomic transition integrity. RigorBench reports process discipline as a distinct measurable dimension. Source: arXiv:2606.22678.
- Benchmark validity itself must be verified: OpenAI's 2026 audits found substantial task-quality problems in SWE-bench Pro and earlier contamination/design problems in SWE-bench Verified. Therefore Elite should treat evaluation integrity, leakage resistance, task quality, and independent verification as first-class controls, not assume a benchmark is ground truth.

## Open/recoverable items
- PR #35 (context continuity firewall + registry) is open and currently not mergeable; do not claim it is merged until fresh GitHub evidence says so.
- The recovered ledger itself is an implementation artifact only after the branch commit is confirmed.
- Provider 429/fallback remains a real operational blocker until a fresh task-specific run demonstrates recovery.
- Any idea recovered from conversation but absent from the owning project should be investigated before modifying another repository.

## Provenance
- Primary recovery source: prior conversation context and personal-context retrieval, 2026-09-18.
- GPU rental idea specifically recovered from the conversation titled/identified as "GPU rental offer analysis".
- Repository facts must be re-verified against GitHub before being treated as current state.
