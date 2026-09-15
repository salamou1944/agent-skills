---
name: revenue-offer-verifier
description: Verify monetization offers before publication or revenue claims using explicit evidence, provider contracts, and fail-closed rules.
---
# Revenue Offer Verifier

Verify an opportunity before it can be published or counted.

Required evidence:
- source is reachable
- offer actually exists
- material terms are known
- payout mechanism and eligibility are known
- provider identity is known

Return explicit states: `verified`, `needs_verification`, or `blocked`.

Do not infer acceptance, commission, payout, conversion, or revenue from a screenshot, environment variable, referral URL, or configuration alone. If a provider API or webhook is required, require a passing adapter/integration check before production status.
