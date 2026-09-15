# Revenue Engine Operating Board

Target geography: Europe + Americas. Algeria is not the initial acquisition market for this engine.

| Priority | Market | Offer | Acquisition channel | Required activation | Current state | Next action |
|---:|---|---|---|---|---|---|
| 1 | US | ElevenLabs | YouTube + SEO + short video | approved affiliate account + unique tracking link | **LINK CONFIGURED + ADAPTER WIRED** | Run live provider-status check; then publish first compliant asset |
| 2 | UK | ElevenLabs | YouTube + SEO + short video | same | QUEUED | Reuse English asset set after US validation |
| 3 | Canada | ElevenLabs | YouTube + SEO + short video | same | QUEUED | Reuse English asset set after US validation |
| 4 | US | Hostinger | SEO + YouTube + short video | approved affiliate account + tracking link | QUEUED | Activate second offer after first funnel is instrumented |
| 5 | UK | Hostinger | SEO + YouTube | same | QUEUED | Expand winning topic |
| 6 | US | Payoneer | SEO + creator/business content | partner application + tracking | QUEUED | Submit application; publish only after approval |

## Time-critical sequence

1. **Account activation:** obtain real affiliate links. ElevenLabs link is now configured in Railway production.
2. **Adapter integration:** ElevenLabs adapter is wired into the Revenue Engine operator and provider registry.
3. **Live tracking validation:** run `npm run revenue:affiliate:status`; this performs the adapter health check and verifies that the tracking URL is present without printing the URL value.
4. **First asset:** publish one high-intent problem/solution piece with clear affiliate disclosure.
5. **Measurement:** record clicks, registrations, paid conversions, and provider-confirmed commission.
6. **Decision gate:** after real signal, either scale the topic/market or kill it.
7. **Second offer:** activate Hostinger in parallel once the first measurement path is proven.

## Non-negotiable revenue rule

Credits, impressions, clicks, registrations, simulated events, or projected commissions are **not cash revenue**. Revenue is recorded only from a provider-confirmed commission event.

## Compliance gates

- No self-referrals.
- No fake accounts.
- No cookie stuffing.
- No spam.
- No misleading or guaranteed-income claims.
- Affiliate disclosure must be clear and close to the endorsement/link.
