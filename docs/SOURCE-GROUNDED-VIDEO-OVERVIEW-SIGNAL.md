# Source-Grounded Video Overview Signal

## Why this matters

Gemini Notebook's current Video Overviews can transform notebook sources into AI-generated videos, with configurable format, language, visual style, and steering instructions. Google documents Explainer, Short, and Cinematic formats, and warns that generated narration and visuals can contain inaccuracies or audio glitches. Video generation can also take more than 30 minutes. 

This is useful as an architectural signal, not as a dependency on one vendor.

## Capability extracted

The important pattern is:

`source collection → grounded synthesis → visual narrative → generated artifact`

The stronger engineering version adds:

`provenance → contradiction detection → freshness → claim ledger → artifact QA → performance measurement`

## Integration target

### MONY

Use source-grounded video generation as a stage in the existing factory:

`research → source-grounding → creative strategy → storyboard → provider routing → generation → QA → publish → analytics → repurpose → revenue attribution`

The video provider must remain replaceable. Gemini Notebook/Veo can be one provider; other providers can execute the same provider-neutral contract.

### Elite / ARMY-14

Use the same pattern for evidence-backed technical explanations, repository documentation, research briefings, and training artifacts.

The agent should be able to answer:

- Which source supports this claim?
- Are two sources inconsistent?
- How old is the evidence?
- Which scenes depend on unresolved claims?
- Did the generated artifact preserve the source meaning?
- What evidence proves the final artifact passed QA?

## Important limitations

- AI-generated video/audio can contain inaccuracies and glitches.
- Generation may be slow.
- Source import has format-specific limitations.
- A generated video is not proof of factual correctness.
- A source-grounded artifact still requires rights/licensing and publication checks.
- Vendor-specific features must not become hard architectural dependencies.

## Acceptance evidence

A future implementation should record:

- source IDs and locators
- claim-to-source mapping
- contradiction status
- source freshness
- storyboard version
- provider/model
- generation cost and duration
- revision count
- QA result
- publication result
- downstream performance

## Google reference

See Google's current Gemini Notebook documentation for Video Overviews and source handling.
