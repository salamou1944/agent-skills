# MONY — Revenue Engine Project State Checkpoint

> Project continuity keyword: **mony**
>
> This file is a non-secret project checkpoint. Never store affiliate URLs, tokens, passwords, API keys, or credentials here.

## Current state — 2026-09-15

### Repository
- GitHub: `salamou1944/agent-skills`
- Main branch is the active integration branch.

### Revenue Engine
- Architecture: `discover -> verify -> score -> route -> package -> publish -> measure -> learn`
- Revenue rule: only provider-confirmed commission events count as revenue.
- Target acquisition geography: Europe + Americas; Algeria is not the initial acquisition market.
- Five monetization paths: affiliate, digital product, API, micro-SaaS, data/opportunity.

### ElevenLabs Affiliate
- Provider: ElevenLabs.
- Adapter: `apps/revenue-engine/elevenlabs-affiliate-adapter.mjs`
- Environment variable: `ELEVENLABS_AFFILIATE_LINK`
- Railway production variable exists on `easy-platform-runtime-v3`.
- The actual URL value is intentionally not stored in GitHub or this checkpoint.
- Adapter is wired into `apps/revenue-engine/revenue-operator.mjs` under provider key `elevenlabs-affiliate`.
- Live status command: `npm run revenue:affiliate:status`.
- Railway `easy-platform-runtime-v3` has this command as a pre-deploy verification gate.
- Latest Railway deployment after the integration completed with `SUCCESS` and the EASY runtime healthcheck passed.

### Key commits in the current sequence
- ElevenLabs adapter: `731632bcf91ef34fb1d3ea6ffc47cf3fcd554066`
- ElevenLabs adapter tests: `5276fa716ea371027e80830c37ac20dfc8bafd08`
- Campaign planner: `d5ba73658752e398069c50dff8b964f230d7cd21`
- Campaign planner tests: `b23fd88411d7bdfe1a78e7fa7bba4040e2b1dca5`
- Operating board: `8557f783c899e5c8db4f2df57d6e5761de1685bd`
- ElevenLabs operator integration: `bc0ab68f252663192d3835d35c516471294981eb`
- Revenue affiliate status script: `47d541bc38835b567e91551974fdf69e0a65559a`
- Operating board update: `3c36ea45885939935fbb07e5a3d945689d78ca37`

### Railway
- Project: `EASY Developer Platform`
- Project ID: `778678c6-dd6e-40fe-a33e-63d0953ab7d4`
- Environment: `production`
- Environment ID: `ae3d2189-2aa5-4c5e-8ee8-9bfdc45dc2a4`
- Active service: `easy-platform-runtime-v3`
- Service ID: `721280c9-8045-4bcb-a932-3455866bae2b`
- Source: `salamou1944/agent-skills`, branch `main`.
- Pre-deploy affiliate verification is configured.
- Latest verified deployment: `9d37427f-b62c-49ee-ab0a-2f77182ac86d` — `SUCCESS`.

## Immediate next checkpoint
1. Run/confirm `revenue:affiliate:status` against the production environment.
2. Validate the ElevenLabs tracking link through the provider/PartnerStack attribution path without exposing the URL.
3. Build the first compliant US acquisition asset.
4. Measure clicks, registrations, paid conversions, and provider-confirmed commissions.
5. Then expand to UK and Canada.
6. Keep Hostinger and Payoneer queued until the first funnel is instrumented.

## Operating constraints
- Maximum execution speed, but no false completion claims.
- Never count simulated events or projected commissions as revenue.
- No self-referrals, fake accounts, cookie stuffing, spam, misleading claims, or guaranteed-income claims.
- Do not store secrets in GitHub/checkpoint files.
