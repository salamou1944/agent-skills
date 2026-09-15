# Revenue Engine

A provider-neutral, fail-closed revenue operating system for five monetization paths:

1. Affiliate offers
2. Digital products
3. APIs
4. Micro-SaaS
5. Opportunity/data products

The engine does not pretend that credits, impressions, or simulated executions are cash. It creates opportunities, scores them, generates a deterministic execution plan, and refuses to claim revenue until a real provider/event confirms it.

## Architecture

`discover -> verify -> score -> route -> package -> publish -> measure -> learn`

Every opportunity can fan out into multiple monetization surfaces. The same source opportunity may become an affiliate deal, a digital product, an API idea, a SaaS experiment, and/or a paid data alert.

## Safety / anti-regression rules

- No provider credentials are stored in source.
- No self-referrals, fake accounts, cookie stuffing, spam, or deceptive claims.
- Provider adapters are explicit and disabled until configured and integration-tested.
- Revenue is recorded only from confirmed events.
- Unknown or unverified offers are blocked from publishing.
- The core remains runnable with zero external credentials in deterministic dry-run mode.

## Run

```bash
node apps/revenue-engine/revenue-engine.mjs
node apps/revenue-engine/test-revenue-engine.mjs
```

## First milestone

The first milestone is intentionally not a giant UI. It is a tested operating core that can be connected to real discovery, affiliate, publishing, payment, and analytics providers without rewriting the business logic.
