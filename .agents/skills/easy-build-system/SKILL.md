---
name: easy-build-system
description: Use when building or evaluating EASY. Map EASY product requirements to existing skills, tools and APIs, identify the first missing capability, and close the gap with a deterministic contract and validation before implementation proceeds.
---
# EASY Build System

## Goal
Build EASY incrementally without replacing working product flows or claiming capability that has not been verified.

## Capability domains
- product-understanding: product identity, category, attributes, immutable facts and evidence
- product-integrity: protect color, logo, printed text, brand name, shape, components and design details
- creative-planning: transform verified product facts into a creative brief while keeping immutable facts unchanged
- creative-validation: compare generated output against Product DNA and reject identity drift
- seller-experience: mobile-first seller flow, upload, progress, review, confirm and export
- commerce-data: product, seller, offer, rating, availability and delivery data contracts
- api-contracts: provider-neutral interfaces with schemas, errors, idempotency and versioning
- integration-boundary: external providers remain replaceable and disabled until explicitly admitted
- observability: evidence, status, failures, provenance and reproducible test cases
- security: secret handling, permission boundaries, input validation and fail-closed behavior

## Reuse-first rule
Before creating a new capability, inspect and reuse the strongest applicable repository capability, especially:
- capability-gap-builder
- architecture-xray
- api-production-readiness
- adaptive-orchestrator
- autonomous-build-loop
- change-impact-graph
- bug-triage
- code-review

Do not create duplicate skills when an existing one can satisfy the requirement after composition.

## Required build loop
1. State the EASY requirement precisely.
2. Inspect the existing code, contracts, skills and tools.
3. Map the requirement to reusable capabilities.
4. Identify the first blocking gap.
5. Choose the smallest missing unit: skill, tool, API contract, validator, adapter or test.
6. Implement it with an explicit operational contract.
7. Add deterministic validation and evidence.
8. Re-run the affected capability chain.
9. Stop on an unverified dependency instead of simulating success.
10. Record the remaining gap for the next iteration.

## Product DNA invariant
For any capability that handles product assets, separate:
- IMMUTABLE: color, logo, printed text, brand name, shape, components, design details
- FLEXIBLE: background, environment, lighting, camera, composition, objects, effects and context

Never invent product facts. Missing evidence must remain unknown.

## Completion gate
A capability is complete only when its contract, implementation, validation and failure behavior are all present and the validation passes.
