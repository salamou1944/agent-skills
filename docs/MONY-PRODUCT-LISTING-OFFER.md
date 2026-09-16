# mony — AI Product Listing Generator

## Product

A productized sales layer over the existing `salamou1944/Salamou-31` AI Product Content API. It turns a seller's product information into a delivery-ready listing without creating a second generation engine.

## Offer

| Plan | Scope | Price |
|---|---:|---:|
| Free sample | 1 product | $0 |
| Starter | 20 products | $79 |
| Scale | 100 products | $249 |

Prices are offer configuration, not evidence of revenue.

## Customer flow

1. Seller submits product name/details/language and optional image URL.
2. `POST /product-listing/qualify` validates the request.
3. `POST /product-listing/order` creates an order record in memory with the selected plan.
4. `POST /product-listing/generate` uses the Salamou-31 API when configured; otherwise dry-run uses a safe fixture.
5. The response contains structured content plus a Markdown delivery artifact.
6. `POST /product-listing/payment-handoff` returns a payment-ready handoff. No payment provider is activated or claimed as connected.

## Upstream boundary

The sales layer calls only the provider-neutral HTTP contract exposed by Salamou-31:

`POST /v1/product-content`

It sends `x-api-key` only at runtime. Credentials are never stored in this repository.

## Verification

- `apps/revenue-engine/test-product-listing-sales.mjs` covers qualification, plan selection, mocked upstream generation, fixture fallback, deliverable creation, payment handoff, and invalid input.
- `.github/workflows/revenue-engine.yml` runs syntax checks and the product-listing sales test on changes under `apps/revenue-engine/**`.

## Current boundary

Implemented and testable: offer → qualification → order → generation → deliverable → payment-ready handoff.

Not claimed: live payment collection, verified customer, paid order, or revenue. Those require an external billing adapter and real customer transaction evidence.
