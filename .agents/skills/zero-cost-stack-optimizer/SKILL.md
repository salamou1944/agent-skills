---
name: zero-cost-stack-optimizer
description: Builds the cheapest viable application stack by routing static hosting, APIs, AI inference, storage, databases, CI, and automation through verified free tiers or open-source self-hosting.
---
# Zero-Cost Stack Optimizer

## Objective
Reach the first working version without unnecessary paid infrastructure.

## Routing order
1. Local/open-source execution when practical.
2. GitHub public repository + GitHub Actions for CI; standard runners are free for public repositories.
3. GitHub Pages only for eligible static/non-commercial project sites; GitHub explicitly says Pages is not for online businesses, e-commerce, or commercial SaaS.
4. Cloudflare Workers/Pages for lightweight production endpoints and static assets when the use case fits the free limits.
5. Supabase Free for small backend/database prototypes, while tracking inactivity pause and project limits.
6. Vercel Hobby only after checking whether the intended use fits its current plan/terms.
7. Paid infrastructure only when a documented free route cannot satisfy the workload.

## Required ledger fields
Provider, component, free limit, card requirement, sleep/pause behavior, commercial-use eligibility, current source, last verified date, fallback provider, and expected monthly cost.

## Cost guard
Never solve a quota problem by silently adding a paid provider. First try provider routing, caching, batching, smaller models, local models, or a different free tier.

## Safety
Do not rotate or share credentials to evade provider limits. Do not create fake accounts. Do not bypass rate limits.
