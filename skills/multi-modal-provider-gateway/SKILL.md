# Multi-Modal Provider Gateway

## Purpose

Provide a provider-neutral contract for chat, image, audio, video, OCR, translation, and embeddings when one upstream gateway exposes multiple modalities behind a common authentication and accounting layer.

## Pattern

task -> modality -> provider capability lookup -> policy/quality/cost check -> request -> usage evidence -> output validation -> fallback or BLOCKED

## Requirements

- Keep provider identity, model identity, modality, token/credit cost, latency, and response status in telemetry.
- Separate self-hosted/free-pool models from externally routed premium models; never assume one allowance covers both.
- Enforce per-provider rate limits and daily/monthly budgets locally.
- Treat HTTP 402, 429, 5xx, timeout, and malformed output as distinct states.
- Validate generated artifacts before accepting them as task evidence.
- Support OpenAI-compatible chat contracts without coupling the system to OpenAI-specific semantics.
- Prefer provider capability discovery over hard-coded model assumptions.
- Do not store provider keys in source files or generated frontend code.

## Elite / ARMY-14 integration

Use this gateway as an optional provider in the existing ladder. It may reduce provider fragmentation, but it must not become a single point of failure. A successful provider call is not task verification; the existing evidence-driven task gate remains authoritative.

## MONY integration

Useful for low-cost copy, translation, OCR, image generation, and campaign-asset experiments. Track exact token consumption and output quality so free allowances are treated as experimental capacity rather than guaranteed production capacity.

## EASY integration

Potentially useful for image generation/editing, background removal, OCR, translation, TTS/STT, and creative experiments. Product DNA and Product Integrity checks must run before and after image transformations so provider output cannot silently alter protected product attributes.

## Security

Treat the provider as an external trust boundary. Do not send secrets, credentials, private repository contents, or sensitive customer data unless the applicable provider policy and data path are explicitly verified. Never bypass provider quotas, CAPTCHA, authentication, or rate limits.

## Completion rule

Provider availability may unblock execution; it never proves the task itself. Record provider-specific limitations separately from task verification.
