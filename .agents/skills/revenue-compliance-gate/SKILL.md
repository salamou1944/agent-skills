---
name: revenue-compliance-gate
description: Gate monetization experiments before publication. Use for affiliate, digital-product, API, micro-SaaS, and data-product campaigns to detect prohibited or unsupported claims and require evidence for provider terms, eligibility, disclosure, and payout mechanics.
metadata:
  version: "1.0.0"
---
# Revenue Compliance Gate

## Required checks
- Provider identity is known and source is reachable.
- Offer/program exists and current terms are captured.
- Eligibility and payout method are known for the intended operator/jurisdiction.
- Affiliate disclosure is included where required.
- No self-referral, fake account, cookie stuffing, bot manipulation, credential harvesting, spam, deceptive claims, or guaranteed-income claims.
- Product claims are supported by evidence.
- Revenue is described as unconfirmed until a provider event confirms it.

## Decision
- `approved`: all required evidence and policy checks pass.
- `needs_verification`: material evidence is missing.
- `blocked`: a prohibited behavior or unsupported material claim is detected.

Never convert `needs_verification` into `approved` by assumption.
