# Context Continuity Protocol

Purpose: prevent project-state loss or cross-project conflation across conversations and autonomous runs.

## Non-negotiable rules
1. Resolve exactly one primary project scope before execution.
2. Keep product, revenue, coding-agent, field-execution, API-hub, and memory projects separate.
3. Never infer implementation status from conversational recollection when repository/runtime evidence is available.
4. Keep IDEA, DECISION, IMPLEMENTED, TEST_VERIFIED, TASK_VERIFIED, DEPLOYED, LIVE_VERIFIED, and PRODUCTION_READY distinct.
5. Unknown or conflicting context is BLOCKED, never guessed.
6. Every important recovered fact requires provenance.
7. Task evidence is separate from pipeline health.
8. Deployment metadata is not proof of live runtime state.
9. Revenue claims require external payment or provider-confirmed commission evidence.
10. Cross-project mutations require explicit scope resolution and authorization.

## Required context envelope
Before execution resolve:
project_id, repository, owning_component, artifact_type, goal, current_status,
source_of_truth, evidence, last_verified_revision, open_blockers,
dependencies, and forbidden_cross_scope_mutations.

## Recovery procedure
1. Recover available context.
2. Extract atomic facts, decisions, and unresolved items.
3. Attach provenance and confidence.
4. Compare against current repository/runtime evidence.
5. Deduplicate by canonical project/artifact ID.
6. Preserve conflicts explicitly.
7. Resume only after scope is resolved.

## Principle
Durable, scoped artifacts are the source of continuity. Missing conversational context must never silently change project state.
