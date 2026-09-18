# Generative Design Intelligence Layer

## Decision
The 8B signal is useful as an architectural reference, not as a runtime dependency.

The useful capability is the combination of:
- prompt -> complete coherent interface
- conversational incremental editing
- element-scoped edits to remove ambiguity
- preservation of manual edits
- real portable output
- built-in SEO/accessibility/performance expectations

## Integration targets

### EASY
Use the pattern for seller-facing creative and storefront interfaces:
- brief/product context -> composed experience
- selected-element correction -> localized change
- Product DNA / Product Integrity constraints remain authoritative
- generated changes must not silently alter protected product attributes

### MONY
Use the pattern for landing pages and campaign assets:
- offer -> complete page
- campaign iteration -> scoped edits
- preserve approved copy and tracking configuration
- verify links, analytics, and conversion paths before publish

### Elite / ARMY-14
Treat interface generation as an agent task with explicit state:
intent -> plan -> compose -> edit -> validate -> evidence

The agent should be able to explain what changed and prove that unrelated user edits survived.

### Agent UX
Combine this layer with the existing agentic orchestration and evaluation capabilities:
- visible task state
- tool-call status
- approval gates
- blocked state
- validation evidence

Do not expose hidden chain-of-thought.

## Engineering invariant
Prefer incremental, scoped changes over destructive full regeneration.

When the user says change this, the system should identify the target element/component first. If the target is ambiguous, it must not guess silently.

## Verification benchmark
Measure:
1. intent-to-layout fidelity
2. edit locality
3. preservation of unrelated edits
4. responsive correctness
5. accessibility regressions
6. SEO/metadata regressions
7. build/runtime regressions
8. export reproducibility
9. generation cost/latency
10. hallucinated or missing UI relationships

## External references
8B: https://8b.com/
Open-source complementary reference inspected during research:
https://github.com/karero/website-builder

The complementary reference is MIT-licensed and describes an AI website-builder skill suite; use it for additional benchmarking rather than copying implementation.

## Status
Integrated as an engineering capability specification. Runtime implementation should be introduced only where an existing product path requires it and can be tested end-to-end.