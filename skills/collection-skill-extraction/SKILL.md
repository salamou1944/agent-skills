---
name: collection-skill-extraction
description: Extracts reusable, evidence-backed agent skills from verified external projects while preventing duplicate control planes, unsafe imports, and unverified capability claims.
---
# Collection Skill Extraction

## Purpose
Turn verified Collection findings into reusable skills rather than importing external projects wholesale.

## Procedure
1. Read the verified Collection source and record the exact revision, license, dependencies, and evidence boundary.
2. Classify the finding as a repeatable method, knowledge, runtime/service, adapter, tool, reference/pattern, or verification asset.
3. For repeatable methods, define the smallest useful Skill with explicit inputs, actions, outputs, evidence, failure states, and security boundaries.
4. Compare the proposed Skill against the canonical skills tree before creating it; reuse or extend an existing Skill when it already covers the behavior.
5. Create the Skill only when it adds non-duplicative procedural value.
6. Test discovery, invocation, output quality, and regression behavior using repository-native fixtures.
7. Record provenance and the verification result in the Collection migration matrix.
8. Route verified Skills to Elite/ARMY-14/Operator only after task-specific evidence passes.

## Non-duplication rule
Do not import a framework, gateway, runtime, or control plane merely because it is more complete. Extract only the smallest capability that closes a demonstrated gap.

## Completion rule
A Collection item is not promoted merely because it exists in a source repository. Promotion requires pinned provenance, license/dependency review, isolated verification, and a reusable Skill contract.
