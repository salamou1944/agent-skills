---
name: easy-product-dna
description: Use when EASY receives a product asset and needs a factual Product DNA record before any creative generation or catalog operation.
---
# EASY Product DNA

## Purpose
Convert seller-provided product evidence into a structured identity record without inventing facts.

## Required extraction
Record, when observable:
- identity/name
- category and product type
- shape and proportions
- visible colors
- materials only when visually supported
- logo and brand name
- printed text and markings
- packaging
- visible components and features

For every field preserve evidence and confidence. Unknown is a valid value.

## Immutable boundary
IMMUTABLE: color, logo, printed text, brand name, shape, components and design details.

FLEXIBLE: background, environment, lighting, camera, composition, objects, effects and context.

## Rules
1. Never hallucinate a specification, material, feature or brand fact.
2. Do not normalize or rewrite printed product text as if it were verified.
3. Preserve multiple observed colors rather than collapsing them into one guessed color.
4. Flag ambiguity instead of choosing a convenient interpretation.
5. Downstream creative systems may alter only FLEXIBLE fields.
6. Any identity conflict blocks creative approval.

## Validation
A Product DNA record passes only if each populated immutable field has source evidence and unknown fields remain explicitly unknown.

## Failure
If the asset is insufficient to establish identity or an immutable attribute, return a blocked/needs-review state rather than a fabricated record.
