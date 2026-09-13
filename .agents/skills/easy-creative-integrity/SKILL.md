---
name: easy-creative-integrity
description: Use when EASY reviews a generated product creative and must prove that the product identity was preserved before release.
---
# EASY Creative Integrity

## Purpose
Validate a creative output against the approved Product DNA before it reaches a seller or customer.

## Check immutable attributes first
Compare the output against the source evidence for:
- product color
- logo and brand name
- printed text and markings
- shape and proportions
- components and design details

## Allowed changes
Background, environment, lighting, camera, composition, contextual objects and effects may change only when they do not alter the product identity.

## Decision states
- `pass`: immutable attributes are preserved with sufficient evidence
- `review`: evidence is ambiguous or comparison confidence is insufficient
- `block`: an immutable attribute changed, disappeared, was invented, or cannot be trusted

## Validation contract
Every decision must contain:
1. Product DNA reference
2. Output reference
3. Immutable checks performed
4. Evidence or comparison result for each check
5. Final decision
6. Failure reason when not `pass`

## Fail closed
Never approve a creative merely because it looks plausible. If identity preservation cannot be demonstrated, block or request review.
