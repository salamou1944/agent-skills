# MONY — Revenue Engine Project State Checkpoint

> Project continuity keyword: **mony**.
>
> **Canonical machine state:** the authoritative machine-readable MONY state is maintained in `salamou1944/AI_operating_memory/PROJECT-STATE-MONY-CANONICAL.json`. This file is a repository-local engineering snapshot only; it must not become a competing state store.
>
> Never store affiliate URLs, tokens, passwords, API keys, or credentials here.

## Current engineering state — 2026-09-17
- GitHub: `salamou1944/agent-skills`, main is the active integration branch.
- Revenue Engine architecture: `discover -> verify -> score -> route -> package -> publish -> measure -> learn`.
- Revenue rule: only provider-confirmed commission events count as revenue.
- Acquisition target: Europe + Americas; Algeria is not the initial acquisition market.
- Monetization paths: affiliate, digital product, API, micro-SaaS, data/opportunity.

## Hardening now implemented
- Elite result semantics keep task verification separate from pipeline verification; a practical runner cannot promote `PIPELINE_VERIFIED` to task completion.
- Provider resilience primitives cover retry/backoff, rate-limit handling and circuit breaking.
- Supervisor has an explicit bounded state machine with repair/transition budgets and fail-closed terminal states.
- ARMY-14 has scoped ownership/conflict detection primitives to prevent accidental overlapping file ownership.
- Evidence ledger defines the affiliate evidence ladder: `configured → reachable → click_observed → signup_observed → conversion_observed → commission_confirmed → payout_confirmed`.
- Canonical project-state integrity is hash checked.
- AI Product Content API has persistent idempotency replay protection for successful retries and a regression test.

## ElevenLabs Affiliate
- Adapter: `apps/revenue-engine/elevenlabs-affiliate-adapter.mjs`.
- Environment variable: `ELEVENLABS_AFFILIATE_LINK`.
- The URL value is intentionally not stored in GitHub/checkpoint files.
- A configured/reachable tracking link is **not** treated as proof of click, signup, conversion, commission or payout.

## Railway / production evidence
- Existing Railway deployment information is historical operational context; production health is not equivalent to task or revenue verification.
- Live probes verify reachability only. They never fabricate revenue.
- Billable AI generation tests must remain explicitly gated rather than being implicit side effects of every push.

## Acquisition constraints
- Do not spam or duplicate recent prospects.
- Do not retry bounced addresses unless explicitly authorized.
- Do not claim an Upwork submission without an authenticated submission action and observable evidence.
- Preserve evidence for every outreach, reply, application, payment and delivery.

## Verification contract
Before any completion claim:
1. Re-read applicable repository rules.
2. Inspect changed files and resulting diff.
3. Run syntax/tests or the strongest repository-native checks available.
4. Confirm task-specific acceptance evidence.
5. Record unresolved limitations in canonical state.
