# Free-First Revenue Discovery — 2026-09-15

## Scope
Broad GitHub/web sweep focused on: free AI APIs, free hosting, self-hosted apps, affiliate systems, lead generation, freelance marketplaces, revenue tracking, and reusable agent infrastructure.

This is a discovery sweep, not a literal exhaustive traversal of every GitHub repository. GitHub search and public web indexing do not expose a provable complete universe of every repository.

## Verified provider evidence

| Provider | Free capability observed | Constraint | Source |
|---|---|---|---|
| GitHub Actions | Standard runners free for public repositories; GitHub Free private allowance 2,000 min/month | Larger runners are charged | https://docs.github.com/en/billing/concepts/product-billing/github-actions |
| GitHub Pages | Free for public repositories on GitHub Free | GitHub says Pages is not for online business/e-commerce/commercial SaaS | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Cloudflare Workers | 100,000 requests/day on Free; 100 Workers/account; 5 Cron Triggers/account | 10 ms CPU/invocation; 50 external subrequests/invocation | https://developers.cloudflare.com/workers/platform/limits/ |
| Cloudflare Workers AI | 10,000 Neurons/day free allocation | Beyond free allocation requires Paid plan | https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| Supabase | $0 Free plan; 500 MB DB/project; 1 GB storage; 2 active projects | Projects pause after 1 week inactivity | https://supabase.com/pricing |
| Vercel | Hobby $0/month with deploy/CI/CD/CDN features | Current plan terms must be checked for intended commercial use | https://vercel.com/pricing |

## GitHub projects discovered

### Income / monetization
- `Perufitlife/incomeos` — MIT self-hosted revenue dashboard; tracks Stripe, affiliates and other sources; MCP for AI access. Useful pattern: revenue observability as a first-class subsystem.
- `spinov001-art/free-api-monetization-guide` — free API -> niche product, DaaS, monitoring, wrapper SaaS, content/SEO, consulting. Revenue figures are repository claims and must not be treated as guarantees.
- `Affitor/open-affiliate` — machine-readable affiliate registry with CLI, SDK, REST API and MCP. Useful pattern: affiliate discovery as an AI-readable data source.
- `stay4ever/affiliate-agent` — multi-agent affiliate workflow: niche research, product discovery, content, SEO and performance analysis. Useful pattern for orchestration; inspect license/maintenance before reuse.

### Lead generation / sales
- `eracle/OpenOutreach` — self-hosted B2B lead finder + qualification + email workflow. README states affiliate-funded model and free search/paid verified lookups. Useful pattern: lead discovery -> qualification -> outreach.
- `eracle/OpenOutFind` — extracted lead-finding core producing qualified CSV output.
- `Atum246/keelead` — MIT self-hosted AI lead generation with claimed free data sources and MCP support. Verify data-source terms before commercial use.

### Free infrastructure / app launch
- `sass-maker/free-ai` — OpenAI-compatible gateway routing across multiple free AI providers on Cloudflare Workers.
- `use-ash/apex` — self-hosted AI agent platform with memory/skills; current README says core server/web app/memory/skills remain free, while some premium features change after 2026-09-30.
- `every-app/every-app` — open-source personal app platform with self-hosting patterns.
- `oddbit/shrtnr` — self-hosted URL shortener with analytics/MCP on Cloudflare Workers + D1; README describes a free-tier deployment.
- `LifanovI/FreeTierBot` — Telegram bot platform/Terraform blueprint designed around free cloud tiers.

### Free API discovery
- `vhmns14/free-ai-api-tiers` — curated free AI API tier matrix.
- `OuterSpacee/free-ai-apis` — broad free AI API catalogue.
- `public-api-lists/public-api-lists` — curated 730+ free public APIs across many categories.
- `free-public-apis/apis` — long-running free public API catalogue.

### Zero-fee marketplace pattern
- `freelancezero/freelancezero` — MIT self-hostable freelance marketplace claiming 0% platform fee and direct client-to-freelancer payments. Useful architectural pattern; not a substitute for finding actual clients.

## Capability conclusions for our agent system

1. Maintain a live free-provider registry with verification dates and commercial-use flags.
2. Route workloads across free providers instead of binding to one paid API.
3. Maintain an affiliate registry readable by the agent.
4. Maintain a revenue ledger that distinguishes clicks, signups, approved conversions, and paid withdrawals.
5. Maintain a lead-generation capability that separates free discovery from paid enrichment.
6. Treat self-hosted open-source software as a capability source, not as proof of production readiness.
7. Build a zero-cost deployment planner that selects GitHub Actions, Cloudflare, Supabase, or other providers based on current verified limits.
8. Every money path must end in a verified payout mechanism; no bank-income claim without transaction evidence.

## Security / compliance exclusions

Do not use fake accounts, credential rotation to evade limits, spam, deceptive traffic, scraping that violates provider terms, or any technique designed to bypass quotas or platform controls.

Last sweep: 2026-09-15
