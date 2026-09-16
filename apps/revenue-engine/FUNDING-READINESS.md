# MONY — Funding Readiness

## Purpose

This file is the evidence-first application checklist for MONY. It separates facts verified from the repository from facts that must be supplied or verified outside GitHub.

## Verified from the repository

- MONY is implemented as a provider-neutral Revenue Engine.
- It covers five monetization paths: affiliate offers, digital products, APIs, micro-SaaS, and opportunity/data products.
- The operating flow is `discover -> verify -> score -> route -> package -> publish -> measure -> learn`.
- The engine is fail-closed: it does not treat credits, impressions, or simulated executions as cash.
- Revenue is recorded only from confirmed real provider/events.
- Provider credentials are not stored in source.
- Provider adapters are explicitly disabled until configured and integration-tested.
- Unknown or unverified offers are blocked from publishing.
- The core can run deterministically without external credentials.

## External facts still required before claiming full startup eligibility

These are intentionally marked `UNVERIFIED` until documentary evidence exists:

- `LEGAL_ENTITY`: Is MONY owned by a formally registered company? UNVERIFIED.
- `FOUNDING_DATE`: Legal company founding/incorporation date. UNVERIFIED.
- `HEADQUARTERS`: Legal headquarters and country. UNVERIFIED.
- `COMPANY_WEBSITE`: Public working company/product website. UNVERIFIED.
- `OWNERSHIP_IP`: Evidence that the applying entity owns the MONY software/IP. UNVERIFIED.
- `FUNDING_STAGE`: Self-funded / pre-seed / seed / etc. UNVERIFIED.
- `PRIOR_CREDITS`: Prior cloud/startup credits received. UNVERIFIED.
- `TRACTION`: Real users, customers, revenue, pilots, or other measurable traction. UNVERIFIED.
- `TEAM`: Founder/developer/team information required by individual programs. UNVERIFIED.

## Current program fit — evidence-based

### Google for Startups Cloud — Start

Potential fit if the external requirements are met: working MVP, clear business model, founded within the last 24 months, and no prior Google Cloud credits beyond the free trial. Acceptance remains discretionary.

Current MONY status: `POTENTIAL FIT / EXTERNAL VERIFICATION REQUIRED`.

### AWS Activate — Founders

Potential fit for a self-funded startup if it is new to AWS Activate credits, has a fully functioning company website, and was founded within the past 10 years.

Current MONY status: `POTENTIAL FIT / WEBSITE + LEGAL ENTITY + EXTERNAL VERIFICATION REQUIRED`.

### Microsoft for Startups

Potential fit if the applicant is a privately held, for-profit company developing a software-based product/service owned by the company and satisfies Microsoft's other eligibility requirements.

Current MONY status: `POTENTIAL FIT / LEGAL ENTITY + BUSINESS VERIFICATION REQUIRED`.

### NVIDIA Inception

Potential fit only after the company-level requirements are satisfied, including official incorporation, a working website, and at least one developer.

Current MONY status: `NOT YET PROVEN ELIGIBLE`.

## Application packet to prepare

1. One-sentence MONY description.
2. Problem statement.
3. Product/solution description.
4. Five monetization paths and how they connect.
5. Architecture and safety model.
6. Current MVP evidence and tests.
7. Current blocker and live-readiness plan.
8. Business model.
9. Target market (Europe/US as the intended commercial focus).
10. Founder/team information.
11. Legal entity and IP ownership evidence.
12. Website/demo URL.
13. Traction/revenue evidence when available.
14. Funding history and prior cloud-credit history.
15. Requested infrastructure and estimated monthly usage.

## Non-negotiable evidence rule

Do not state that MONY is eligible, funded, live, revenue-generating, or accepted by a program until the corresponding external evidence exists.

## Next gating sequence

`LEGAL_ENTITY -> WEBSITE -> MVP/DEMO EVIDENCE -> BUSINESS MODEL -> APPLICATION PACKET -> PROGRAM APPLICATION -> VERIFIED BENEFIT -> MONY INFRASTRUCTURE USE`
