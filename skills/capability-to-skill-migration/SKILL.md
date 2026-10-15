---
name: capability-to-skill-migration
description: Migrates an existing internal capability into a canonical reusable Skill without losing behavior, provenance, verification, or ownership boundaries.
---
# Capability to Skill Migration

## Purpose
Make Skill the operational representation for reusable capabilities already present in the system.

## Procedure
1. Identify the existing capability and its current owner, implementation, consumers, and verification evidence.
2. Decide whether it is actually procedural and reusable. If it is only data, infrastructure, an external API, a tool, or a reference, retain its proper classification.
3. Check the canonical skills tree for overlap before creating anything.
4. Extract the repeatable method into SKILL.md, keeping implementation modules separate when needed.
5. Preserve the original capability as the implementation source until the Skill has equivalent or stronger verification.
6. Add provenance, dependencies, security boundaries, failure states, and acceptance evidence.
7. Register the Skill in the discovery mechanism used by this repository.
8. Update Collection and project references so the Skill, not the raw capability label, becomes the reusable operational entry point.
9. Run repository-native validation and a task-specific regression check.

## Safety
Never weaken authentication, quota, payment, provider, repository, or deployment controls during migration. A Skill must fail closed when required evidence is missing.

## Completion rule
Migration is complete only when the Skill is discoverable, tested, traceable to the original capability, and usable without silently depending on an unverified external project.
