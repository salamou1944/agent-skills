---
name: generative-design-engineering
description: Build AI-generated web interfaces from intent while preserving user edits, scoping conversational changes to selected elements, enforcing accessibility/SEO/performance gates, and keeping outputs portable.
---

# Generative Design Engineering

## Purpose
Use this skill when an agent must turn a product brief into a coherent interface, iterate on it conversationally, or improve an existing interface without destructive regeneration.

## Core loop
1. Parse intent: audience, goal, content hierarchy, conversion action, constraints.
2. Compose a complete page/system before micro-editing.
3. Preserve a structured design state so subsequent edits are incremental.
4. Scope ambiguous edits to an explicitly selected element or stable component ID when possible.
5. Apply the smallest change that satisfies the request.
6. Preserve unrelated user edits.
7. Run quality gates before completion.
8. Export/ship portable artifacts where the target permits it.

## Design-state contract
Every generated interface should have a stable internal representation for:
- page/route
- sections
- component IDs
- content
- visual tokens
- responsive rules
- interaction/motion
- accessibility metadata
- SEO metadata
- provenance of AI-generated vs user-edited content

Do not use a full-page regeneration when a local patch is sufficient.

## Quality gates
Before claiming completion, verify as applicable:
- semantic structure
- keyboard/focus behavior
- accessible names and contrast
- responsive behavior
- metadata/OpenGraph/structured data
- broken links/assets
- runtime console errors
- performance budget
- preservation of prior user edits
- deterministic export/build output

A design claim is not verification evidence.

## Agent UX
Expose meaningful execution state when this skill is used by an agent:
- planning
- generation
- tool calls
- validation
- blocked state
- approval required
- completed with evidence

Do not expose hidden chain-of-thought. Show concise status and tool/evidence summaries instead.

## Security and portability
Never inject secrets into generated frontend artifacts. Treat external assets and generated code as untrusted until validated. Prefer standard HTML/CSS/JS or the repository's established stack over proprietary runtime requirements when portability matters.

## Adaptation rule
This skill extracts engineering patterns from AI website builders, including prompt-to-complete-design composition, conversational editing, element-scoped edits, preservation of manual edits, and portable output. It does not copy proprietary implementations or depend on any single external builder.

## Acceptance evidence
A successful run should record:
- input brief
- generated artifact identifier
- edits applied
- checks executed
- failures and repairs
- final verification result
- remaining limitations