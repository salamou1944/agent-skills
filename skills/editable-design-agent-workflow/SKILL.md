---
name: editable-design-agent-workflow
description: Orchestrate conversational creative generation into editable, production-ready design artifacts using Adobe and other provider-neutral tools, with asset structure, layer/editability requirements, brand/product integrity, QA, and handoff evidence.
---

# Editable Design Agent Workflow

Use this skill when an agent must turn a design request into an editable production artifact rather than only a flattened image.

## Contract

`brief → brand/product DNA → creative plan → asset generation → editable assembly → structural QA → visual QA → handoff → measure`

## Rules

1. **Define the deliverable before generation.** Record target platform, dimensions, copy, brand constraints, required editable elements, and acceptance criteria.
2. **Preserve product/brand DNA.** Do not silently alter logos, product geometry, packaging text, colors, claims, or other protected details.
3. **Separate semantic elements.** Keep important text, product imagery, background, effects, and supporting graphics independently editable whenever the provider supports structured output.
4. **Do not confuse image generation with editability.** A visually correct raster image is not evidence of a layered/editable source file.
5. **Treat Adobe as a provider, not the architecture.** Photoshop, Firefly, Express, Illustrator and other creative tools can execute specialized stages while the agent retains orchestration and QA.
6. **Verify editability.** Confirm that the expected editable artifact exists, opens successfully, retains required layers/objects/text, and can be modified without recreating the design.
7. **Verify visual fidelity.** Compare the editable artifact render against the approved preview for composition, text, dimensions, product integrity, and missing assets.
8. **Preserve provenance and rights.** Record source assets, generation providers, licenses/usage constraints, and material transformations.
9. **Keep an artifact trail.** Store brief, creative plan, prompts, source assets, provider actions, QA results, and final artifact references.
10. **Fail closed.** If a request requires a layered PSD or another editable format but the execution path only produces a flattened image, mark the deliverable as incomplete rather than claiming editability.
11. **Provider-neutral fallback.** If Adobe is unavailable, route to another structured-design/editor workflow where it satisfies the same acceptance contract.

## Acceptance evidence

For an editable design, require:

- correct canvas dimensions and format
- expected editable elements present
- text remains editable where required
- product/brand assets remain intact
- no missing or substituted assets
- successful reopen/export test
- rendered preview matches approved design
- provenance/license record
- final artifact reference

## MONY integration

Use for thumbnail, ad creative, social asset, product creative, offer graphic and campaign-variant production:

`offer/brief → creative strategy → design plan → provider routing → editable artifact → QA → publish → performance → learn`

Do not count a generated preview as a completed sellable design deliverable until the required editable artifact and QA evidence exist.

## EASY integration

For seller creatives, keep Product DNA and Product Integrity checks upstream of generation and structural QA downstream. A creative can be visually attractive and still fail if the actual product, packaging, text, logo, or claims were changed.
