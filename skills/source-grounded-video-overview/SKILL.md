---
name: source-grounded-video-overview
description: Convert trusted source collections into source-grounded video-overview plans and provider-neutral video artifacts, with citation traceability, contradiction handling, freshness checks, visual/narrative QA, and fail-closed evidence.
---

# Source-Grounded Video Overview

Use this skill when turning a source collection (PDFs, web pages, YouTube transcripts, documents, images, reports, or mixed research) into an educational, explainer, cinematic, or short video.

## Contract

`sources → inventory → classify → retrieve → reconcile → storyboard → generate → verify → cite → publish → measure`

The generated video is an artifact of the source set, not a free-form answer.

## Rules

1. **Source grounding first.** Build a source inventory before writing the script.
2. **Separate evidence from synthesis.** Mark claims as directly supported, synthesized from multiple sources, or unsupported.
3. **Track provenance.** Every material factual claim should retain source IDs and, where available, a precise citation/locator.
4. **Detect contradictions.** Do not silently merge conflicting sources. Preserve the disagreement, source dates, and scope.
5. **Check freshness.** Record publication/update dates and flag stale evidence when the topic is time-sensitive.
6. **Protect source meaning.** Do not invent facts, statistics, quotations, people, events, product properties, or causal claims not supported by the source set.
7. **Storyboard before generation.** Convert validated claims into scenes with narration, visuals, duration, transitions, and source references.
8. **Provider-neutral execution.** Treat Gemini Notebook/Veo, other video generators, editors, TTS, and image models as interchangeable execution providers.
9. **Artifact QA.** Verify visual/narration alignment, factual fidelity, text rendering, audio quality, missing scenes, and unsupported claims.
10. **Fail closed.** If evidence is insufficient for a material claim, label it as unresolved or remove it; never fill the gap from model memory.
11. **Disclosure and rights.** Preserve source licensing/usage constraints and disclose AI-generated media where required by the publishing destination.
12. **Measure the artifact.** Record provider, generation time, cost/credits, revisions, accepted-artifact cost, publication result, and downstream performance.

## Recommended output

- Source inventory
- Topic map
- Evidence/contradiction matrix
- Claim ledger
- Storyboard
- Provider routing plan
- Generation prompts
- QA checklist
- Citation map
- Final artifact evidence
- Performance/learning record

## MONY integration

For MONY, use this skill inside the video factory:

`research → source-grounding → creative strategy → storyboard → provider routing → generation → QA → publish → analytics → repurpose → revenue attribution`

Do not count a generated video as successful merely because generation completed. Acceptance requires artifact QA and publishing evidence; revenue requires provider-confirmed attribution.
