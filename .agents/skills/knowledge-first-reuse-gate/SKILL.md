---
name: knowledge-first-reuse-gate
description: Mandatory preflight before new research or greenfield implementation. Search existing repositories, collected knowledge, and the pinned Top Five first.
---
# Knowledge-First Reuse Gate

## Mandatory order
1. Current project code, skills, adapters, tests, workflows, and evidence.
2. `salamou1944/agent-skills`.
3. `Salamou-31`, `AI_operating_memory`, `Project-`, `Files-`, `Easy-`, `Astra-`, `Astra`, preserving project boundaries.
4. `Project-/COLLECTION`.
5. The pinned Top Five: Agent Zero, OpenClaw API List, agentic-ai-apis, AI Engineering From Scratch, awesome-free-llm-apis.
6. External research only if the first five layers cannot satisfy the requirement or freshness is required.

## Reuse decision
Classify candidates as `REUSE_NOW`, `ADAPT_AND_VERIFY`, `DISCOVERY_ONLY`, `BLOCKED_PERMISSION`, `BLOCKED_EXTERNAL_DEPENDENCY`, or `REJECTED`. Prefer the smallest existing component that satisfies the requirement.

## Verification
README/catalog/API listings are discovery evidence only. Runtime availability requires authorization, reachability, operation testing, and independent verification.

## Evidence
Record `goal`, `searchedLayers`, `reusedAssets`, `missingCapability`, `sourceRevision`, `verificationStatus`; if external research was needed, record `reasonExternalSearchWasNeeded`.

## Stop condition
Stop searching once an existing evidence-backed capability satisfies the requirement.