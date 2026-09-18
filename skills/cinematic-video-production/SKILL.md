# Cinematic Video Production

## Purpose

Provide a provider-neutral, evidence-driven pipeline for serious AI video production using local or API-backed generators such as LTX-2.5, with optional Blender and 3D asset tooling.

## Contract

Input:
- concept, audience, duration, aspect ratio, visual direction, source assets, product constraints

Pipeline:
1. intent and storyboard
2. shot list and continuity constraints
3. asset acquisition/generation
4. image-to-video/text-to-video/audio-to-video selection
5. shot generation
6. continuity and identity validation
7. edit/assemble
8. audio, captions and VFX
9. render
10. artifact validation
11. reproducible evidence package

## Provider abstraction

Treat LTX-2.5, Blender, Meshy, and other generators as replaceable capabilities, not hard dependencies.

Route by:
- modality
- hardware availability
- quality target
- latency
- cost
- license/usage constraints
- privacy requirements

Never put provider API keys in source code or frontend artifacts.

## Continuity and integrity

For product or character work, maintain a canonical identity record:
- geometry/appearance
- colors and markings
- logos/text
- camera constraints
- prohibited transformations
- approved reference assets

For EASY product creatives, Product DNA and Product Integrity checks remain authoritative. Video generation must not silently alter protected product attributes.

## Local-first execution

When hardware supports local inference, prefer local execution for privacy and predictable recurring cost. If local execution is unavailable, use an approved API provider and record provider/model/mode in evidence.

LTX Desktop currently supports local LTX 2.5 Fast on supported Windows/Linux NVIDIA GPUs and Apple Silicon Macs; API mode is available for unsupported hardware. LTX 2.5 Pro is API-only.

## Validation

A successful generation requires:
- expected file exists
- decodable video
- expected duration/aspect ratio within tolerance
- no missing/corrupt frames
- audio track validated when requested
- required assets present
- protected identity/product attributes preserved
- no unintended provider watermark/metadata when prohibited
- reproducible settings recorded
- provider usage/cost evidence recorded when API-backed

A generated file alone is not task completion.

## Benchmarks

Track:
- prompt-to-shot fidelity
- temporal consistency
- subject identity preservation
- product integrity
- camera/scene consistency
- edit locality
- render success rate
- artifact corruption rate
- latency
- cost per usable second
- regeneration rate

## Safety and provenance

Keep asset/model licenses and source provenance. Do not use the pipeline to generate deceptive impersonation or unauthorized private content. Provider terms and model licenses are part of the acceptance gate.

## Integration targets

- MONY: product-to-cinematic creative variants, hooks, ads and short-form video experiments.
- EASY: product image/link to controlled product creative video while preserving Product DNA.
- Elite/ARMY-14: capability discovery, routing, validation, artifact evidence and fail-closed behavior.
- Blender: deterministic scene composition/render stage.
- Meshy: optional 3D asset generation stage.

## Evidence

Record:
- input references
- storyboard/shot plan
- provider/model/mode
- generation parameters
- source asset hashes where practical
- output hash
- validation results
- license/provenance notes
- cost/latency
- failures and fallback path

Do not claim quality from a single successful sample; use repeatable benchmark evidence.
