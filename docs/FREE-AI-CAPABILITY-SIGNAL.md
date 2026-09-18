# Free.ai Capability Signal

## Verified public capabilities

As of 2026-09-18, Free.ai publicly advertises 400+ AI tools, hundreds of models, a single API surface for multiple modalities, 30,000 free tokens/day for confirmed accounts, and no card required to start. Its developer documentation describes chat, image generation/editing, video, TTS, STT, music, OCR, translation, writing, code, model listing, health, asynchronous job status, webhooks, and an OpenAI-compatible chat endpoint. It also distinguishes self-hosted models from externally routed premium models and documents API rate limits and token accounting.

## Useful engineering signal

The strongest reusable idea is not the free allowance. It is the **multi-modal gateway abstraction**:

- one authentication boundary;
- one usage ledger;
- capability/model discovery;
- modality-specific endpoints;
- provider routing behind the gateway;
- per-response usage evidence;
- fallback without changing the application contract.

## Integration decision

Use Free.ai as a benchmark and optional provider, not as a production dependency or guaranteed capacity source. No API key was available in the project context, so no live provider connection was created and no claim of runtime availability is made.

## Risk / limitation

Free.ai's own platform page says it is a small operation with a single GPU host and does not publish a contractual uptime SLA. Therefore its free pool is useful for experiments and cost reduction, but should not become a single point of failure for MONY, EASY, or Elite.

## Targets

- Elite: optional multi-modal provider in the provider ladder.
- MONY: low-cost text/image/OCR/translation experiments and creative production.
- EASY: creative image/audio/OCR/translation capabilities behind Product Integrity gates.
- ARMY-14: provider discovery, cost-aware routing, artifact validation, and fail-closed fallback.

## Sources

- https://free.ai/
- https://free.ai/api/
- https://free.ai/developer/
- https://free.ai/platform/
