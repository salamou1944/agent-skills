---
name: github-opportunity-miner
description: Performs evidence-led discovery of open-source projects, free tiers, APIs, affiliate systems, marketplaces, and automation patterns that can reduce operating cost or create legitimate revenue opportunities.
---
# GitHub Opportunity Miner

## Objective
Find reusable, legal, currently observable opportunities that can either:
- reduce infrastructure/API/software spend to $0 or a documented free tier;
- create a sellable service/product from open-source components;
- create affiliate/referral revenue;
- create a direct service/freelance revenue path;
- create a repeatable data/content/automation product.

## Required workflow
1. Search GitHub broadly by category: free infrastructure, free AI APIs, monetizable APIs, affiliate registries, lead generation, outreach, freelance marketplaces, content automation, analytics, self-hosted SaaS, MCP/agent tools, and payment/payout infrastructure.
2. Record the repository URL, license, maintenance/activity signal, setup method, dependencies, and claimed free limits.
3. Validate important pricing/limits against the provider's official documentation before marking them `Verified`.
4. Separate `project exists` from `project works`, and `free to run` from `free to operate commercially`.
5. For revenue ideas, map: input -> automation -> deliverable -> buyer -> price/payout rail -> verification evidence.
6. Reject schemes requiring fraud, spam, credential abuse, rate-limit bypass, fake accounts, or deceptive traffic.
7. Produce a shortlist only after evidence collection; never rank by unsupported income claims.

## Output schema
Each finding must include:
- `name`
- `source`
- `category`
- `license`
- `what_is_free`
- `what_can_cost_money`
- `commercial_use_status`
- `revenue_path`
- `payout_dependency`
- `verification_source`
- `verified_at`
- `status`: Verified / User-confirmed / Inferred / Planned / Failed / Unknown

## Hard rule
A GitHub README is not sufficient evidence for current pricing, free-tier limits, or guaranteed income. Preserve the original claim as an attributed claim and verify it separately.
