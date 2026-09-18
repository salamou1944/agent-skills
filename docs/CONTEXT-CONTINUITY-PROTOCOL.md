# Context Continuity Protocol

Purpose: prevent loss, conflation, or accidental promotion of project context across conversations.

## Non-negotiable rules
1. Resolve exactly one primary project scope before action.
2. Keep EASY, MONY, Elite, ARMY-14, agent-skills, Salamou-31, and AI_operating_memory separate.
3. Do not merge concepts because workflows overlap.
4. Keep IDEA, DECISION, IMPLEMENTED, VERIFIED, DEPLOYED, and LIVE states separate.
5. Repository/runtime evidence beats conversational recollection for implementation facts.
6. Task evidence is separate from pipeline health.
7. Runtime evidence is required for live/deployed claims.
8. Deployment claims require the intended revision.
9. Unknown or conflicting context is BLOCKED, never guessed.
10. Every recovered item gets provenance.

## Required context envelope
Before execution resolve: project_id, repository, owning_component, artifact_type, goal, status, source_of_truth, evidence, last_verified_revision, open_blockers, dependencies, and forbidden_cross_scope_mutations.

## State vocabulary
IDEA = proposed.
DECISION = accepted direction.
IMPLEMENTED = code/config exists.
TEST_VERIFIED = relevant automated test passed.
TASK_VERIFIED = task-specific evidence proves behavior.
DEPLOYED = intended revision is deployed.
LIVE_VERIFIED = deployed runtime was directly checked.
HUMAN_TRIAL_READY = bounded human-trial gates pass.
PRODUCTION_READY = production criteria pass.
BLOCKED = prerequisite/evidence missing or contradictory.

Never infer a higher state from a lower state.

## Recovery procedure
1. Recover available prior context.
2. Extract atomic facts, decisions, tasks, and unresolved items.
3. Attach provenance and confidence.
4. Compare with repository state and current evidence.
5. Deduplicate by canonical project/artifact ID.
6. Mark conflicts explicitly.
7. Resume only after scope is resolved.

## Cross-project firewall
EASY = commerce product, customer/seller experience, Creative, Demo, trial.
MONY = Revenue Engine, offers, customer/revenue/affiliate flows.
Elite = coding-agent/runtime engineering capability.
ARMY-14 = multi-agent execution/verification field architecture.
agent-skills = engineering/control-plane source of truth and reusable skills/tooling.
Salamou-31 = AI/API hub and sellable API services.
AI_operating_memory = canonical machine-readable MONY operational state.

## Explicit separations
EASY Demo is not MONY Demo.
Either Demo is not Human Trial.
MONY affiliate revenue is not EASY revenue.
PIPELINE_VERIFIED is not TASK_VERIFIED.
TEST_VERIFIED is not LIVE_VERIFIED.
A successful Railway redeploy is not proof of the intended revision being live.

## Evidence record
For important milestones preserve: project_id, artifact_id, revision, timestamp, checks, result, blockers, and source. Keep contradictory historical evidence visible.

## Principle
Important context must be addressable, scoped, deduplicated, and recoverable from durable artifacts so missing conversational context cannot silently change project state.
