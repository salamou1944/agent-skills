# Revenue Engine contract

## Pipeline

`discover -> verify -> score -> route -> package -> provider-check -> publish -> measure -> learn`

## Five revenue lanes

- **affiliate**: commission from a confirmed third-party conversion.
- **digital_product**: sale of a digital asset.
- **api**: paid API usage or subscription.
- **micro_saas**: recurring application subscription.
- **data_product**: paid access to verified data, alerts, or intelligence.

## Non-negotiable invariants

1. A discovered opportunity is not a verified offer.
2. A verified offer is not a revenue event.
3. A generated asset is not a published asset.
4. A provider environment variable is not provider evidence.
5. Revenue is recorded only from a confirmed provider event with a positive amount.
6. High-risk or deceptive opportunities are blocked before routing.
7. Dry-run mode must work without external credentials.
8. External providers must implement the adapter contract and pass a health/integration check before execution is enabled.

## Build order

### Phase 1: foundation
- deterministic core
- contracts
- scoring
- fan-out planner
- revenue ledger boundary
- tests and CI

### Phase 2: real discovery
- web/search adapter
- affiliate-program discovery adapter
- source evidence store

### Phase 3: first cash path
- affiliate provider adapters
- compliant content generation
- publishing queue
- conversion/event ingestion

### Phase 4: owned products
- digital-product generation
- API packaging
- SaaS packaging
- data products and alerts

### Phase 5: autonomous optimization
- experiment scoring
- winner promotion
- stale-offer monitoring
- revenue attribution

No phase may claim production readiness without real integration evidence.
