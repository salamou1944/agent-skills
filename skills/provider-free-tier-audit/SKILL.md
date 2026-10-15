---
name: provider-free-tier-audit
description: Audits provider free access, quota, hard-stop, eligibility, and terms evidence before allowing a zero-cost provider into routing or execution decisions.
---
# Provider Free-Tier Audit

## Procedure
1. Identify the provider, exact source revision/page, and research date.
2. Record access class, free status, quota basis, estimated recurring capacity when defensible, and eligibility requirements.
3. Distinguish recurring uncapped access from one-time credits and promotional signup capacity.
4. Require explicit evidence before setting hard_stop=true; never infer that overage cannot bill.
5. Record regional, KYC, payment, account, rate, and concurrency gates.
6. Deduplicate shared provider pools so the same underlying capacity is not counted multiple times.
7. Record ToS risk and retain discontinued providers as historical only.
8. Emit a machine-readable policy decision: eligible, ineligible, unknown, or blocked.
9. Re-audit stale provider intelligence before automatic production routing.

## Fail-closed rules
Missing quota evidence, ambiguous billing behavior, disallowed ToS risk, or missing eligibility evidence must not be treated as zero-cost production capacity.

## Provenance
This Skill operationalizes the provider-intelligence method extracted from the verified OmniRoute Collection research. It does not import the OmniRoute gateway runtime.
