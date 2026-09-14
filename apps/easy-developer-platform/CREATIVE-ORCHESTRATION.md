# Creative Orchestration Stage 0.2

The Creative pipeline is now fail-closed:

`Asset → Provider Adapter → Product DNA → Compile → Generate → Integrity/Claims Validation → Delivery`

## Provider boundary

Providers must expose `analyzeAsset(input)` and `generateCreative(instruction, input)`. The orchestrator owns Product DNA creation and output validation, so a provider cannot bypass the integrity gate.

## Disabled production state

With no selected external provider, jobs return `BLOCKED / provider_not_selected`. This is intentional: no fake generation is exposed as production generation.

## Fixture state

The deterministic fixture provider exists only for automated pipeline testing. It proves the orchestration and fail-closed behavior without pretending to generate a real image.

## Security invariant

Any mutation to immutable product DNA (brand, printed text, logo, color, shape, components, design details, or material) blocks delivery. Unverified marketing claims also block delivery.
