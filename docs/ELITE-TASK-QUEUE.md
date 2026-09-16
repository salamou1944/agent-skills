# Elite Cross-Project Task Queue

> Execution policy: finish the target repository's current `goal` first. Only after that goal is verified complete or is a verified no-op should Elite select the next unfinished task from this queue. Never treat a commit, plan, workflow run, or file creation as completion by itself.

## Global rules

1. Inspect the real current repository state before selecting or implementing work.
2. Read and obey the target repository's project rules before changing anything.
3. Preserve repository boundaries; do not mix projects or move project code between repositories.
4. For every failure: identify root cause, fix it, test it, then verify the resulting state.
5. Prioritize incomplete, practical, testable, usable/sellable capabilities over polish.
6. Do not expose, create, commit, or log secrets, tokens, credentials, cookies, or private data.
7. If an external credential/provider is unavailable, use a safe fixture/mock path where it is sufficient to keep development moving.
8. Record concrete evidence for substantive work; distinguish implemented, verified, blocked, and no-op states.
9. If a higher-priority blocker is discovered in the current repository, handle it before lower-priority queue items.
10. After each task, re-inspect the repository and tests before advancing.
11. Review this complete rules list before every response or action, then apply it; do not invent additional project rules as a substitute for the repository/user rules.

## Priority order

### P0 — EASY (`salamou1944/Easy-`)

**Objective:** move EASY toward a practical, usable, sellable product; finish incomplete capabilities rather than polishing already-working UI.

Tasks, in order:

1. Inspect the current EASY state and complete the highest-value unfinished practical blocker.
2. Complete the real Creative Engine path: Product DNA → Product Integrity → creative instruction/orchestration → provider boundary → validated output, without silently changing product facts, colors, text, logos, or product identity.
3. Complete the seller/product workflow needed to take a product from input to a usable result.
4. Complete and verify the provider-neutral commerce integration and its safe fixture/live boundaries; never require live credentials for tests that can use fixtures.
5. Add/repair end-to-end verification for the primary seller journey and critical failure paths.
6. Identify the next concrete missing capability required for a usable/sellable EASY release and implement the smallest safe verified step.

### P0 — mony / Revenue Engine (`salamou1944/agent-skills`)

**Objective:** turn the existing skills/APIs/tools infrastructure into a practical revenue engine that can produce and deliver sellable AI services, while preserving the existing engineering automation.

Tasks, in order:

1. **Productized listing service:** use `apps/revenue-engine/product-listing-sales.mjs` as the canonical mini-sales product over the existing Salamou-31 AI Product Content API. Verify offer → qualification → order → generation → delivery artifact → payment-ready handoff; do not create a second generation engine.
2. Complete the remaining payment/billing adapter boundary so a real payment provider can be activated without coupling the sales layer to one provider; preserve the payment-ready handoff until live credentials and integration evidence exist.
3. Complete the client/opportunity pipeline and ensure opportunity states are explicit: found → submitted → replied → call → accepted → paid → delivery → recurring.
4. Make the existing service/API capabilities directly reusable for paid client work, with safe provider-neutral boundaries and production-readiness checks.
5. Complete the affiliate/income integrations already present in the repository, verifying configuration without storing secrets.
6. Build/verify market-testing and client-hunting automation that produces actionable opportunities without falsely claiming leads, replies, or revenue.
7. Identify the next concrete blocker to the first verified revenue and implement the smallest safe verified step.

### P1 — Salamou-31 (`salamou1944/Salamou-31`)

**Objective:** make the AI/API services practical and sellable.

Tasks, in order:

1. Inspect the real repository and complete the highest-value unfinished service/API capability.
2. Harden and verify AI Product Content API usability, validation, quota handling, and production-readiness boundaries.
3. Complete API documentation/examples needed for real external use without exposing credentials.
4. Add/repair practical tests for critical success and failure paths.
5. Identify and implement the next concrete missing sellable capability.

### P1 — agent-skills engineering core (`salamou1944/agent-skills`)

**Objective:** keep Elite/Supervisor reliable while supporting the project queues above.

Tasks, in order:

1. Inspect actual Elite/Supervisor failures or gaps and fix only verified blockers.
2. Strengthen self-test, capability-closure, fallback, recovery, and evidence collection where tests demonstrate a gap.
3. Improve automatic discovery of unfinished work only when it can be verified safely.
4. Never weaken repository rules, secret handling, CI protection, or fail-closed behavior to make a run appear successful.

## Advancement rule

For each repository, Elite must execute the current workflow `goal` first. Then it may take the first unfinished applicable task above. When a task is implemented, it must pass repository-native verification and post-change inspection before being marked verified. A task that is blocked must be recorded as blocked with the concrete blocker; it must not be falsely marked complete.
