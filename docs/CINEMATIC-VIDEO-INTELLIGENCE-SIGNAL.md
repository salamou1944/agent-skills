# Cinematic Video Intelligence Signal

## Signal

LTX-2.5/LTX Desktop demonstrates a practical serious-video capability surface: text-to-video, image-to-video, audio-to-video, local inference on supported hardware, API fallback, LoRA steering, and an integrated editing workflow.

Official reference:
- https://github.com/Lightricks/LTX-Desktop
- https://github.com/Lightricks/LTX-2

## What to extract

The valuable architectural pattern is not dependency on one model. It is a modality-aware video production layer with:
- local/API execution modes
- provider abstraction
- model capability discovery
- asset and prompt provenance
- continuity/integrity gates
- render validation
- cost/latency evidence
- reproducible outputs

## System integration

MONY:
discover opportunity → product understanding → visual concept → shot plan → generate variants → validate → publish → measure → learn.

EASY:
product image → Product DNA → visual storyboard → controlled generation → Product Integrity Check → publishable creative.

Elite/ARMY-14:
intent → shot contract → provider capability lookup → execution → artifact validation → evidence → fallback/BLOCKED.

## Non-goals

- Do not make LTX a mandatory production dependency.
- Do not assume local generation is available on every machine.
- Do not treat a generated video as proof of quality without validation.
- Do not copy proprietary implementation.

## Decision

KEEP as a reusable capability and benchmark. Integrate through the existing multi-modal provider gateway rather than creating a special-case provider path.
