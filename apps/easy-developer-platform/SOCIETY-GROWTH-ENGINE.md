# Society Growth Engine

## Purpose

This layer models the external world as a measurable operating environment for the existing MONY/EASY/Elite/ARMY-14 system.

It deliberately separates four functions:

1. **Spies** — observe public signals and changes; they do not contact people or act as customers.
2. **Fishers** — qualify signals into demand opportunities using explicit evidence and fit rules.
3. **Mailing** — communicate with qualified opportunities under consent, relevance, suppression, and rate-limit controls.
4. **MONY** — records commercial outcomes and revenue evidence.

## Operating loop

`public signal -> spy observation -> fisher qualification -> mailing eligibility -> human/customer response -> commercial outcome -> learning`

No stage may manufacture the next stage's evidence.

## Safety and integrity gates

- Public observation only unless an explicit integration grants another scope.
- No credential harvesting, impersonation, scraping behind access controls, or bypassing platform restrictions.
- No bulk unsolicited messaging.
- Every contact requires a source, reason for contact, and suppression check.
- A negative/no-interest response suppresses future outreach for that contact.
- A "qualified opportunity" is not a customer.
- A "sent" message is not a lead.
- Revenue is counted only from independently verifiable commercial evidence.
- Failed provider execution remains BLOCKED rather than VERIFIED.

## Proof metrics

The engine should report at least:

- observations
- qualified opportunities
- eligible contacts
- messages sent
- positive replies
- qualified replies
- conversions
- verified revenue
- false-completion count
- suppressed contacts
- duplicate-contact count

Derived rates:

- qualificationRate = qualified / observations
- replyRate = positiveReplies / sent
- conversionRate = conversions / qualifiedReplies
- revenuePerContact = verifiedRevenue / sent
- falseCompletionRate = falseCompletions / terminalTasks

The goal is not to maximize message volume. The goal is to maximize **verified value per qualified opportunity** while keeping false completion and unwanted contact at zero.
