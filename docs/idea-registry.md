# Engineering System Idea Registry

This file is the durable backlog for ideas discovered while designing the engineering system. Ideas are preserved here even when they are not part of the current implementation milestone.

## North-star objective

Build a system that can take an arbitrary software repository and a desired improvement, understand the repository, discover missing capabilities, create one or more solution paths, implement the best safe path in isolation, test it, attempt to break it, collect executable evidence, and only then prepare a reviewable update/PR.

The system should create solutions when a path is blocked rather than stopping at "not found".

## Core ideas — required for the engineering loop

- Repository intelligence / baseline snapshot.
- Change request normalization and acceptance criteria.
- Capability-gap detection connected to change planning.
- Multi-path solution generation and comparison.
- Autonomous implementation/build loop.
- Isolated update sandbox / preview before touching the original repository.
- Build, unit, integration, E2E, regression, compatibility and security verification.
- Failure injection / adversarial verification before promotion.
- Evidence-first execution ledger: every important claim maps to executable evidence.
- Deterministic release/readiness gate.
- Update manifest containing before/after state, residual risks and reviewer actions.
- PR/branch delivery only after the verification gate passes.
- Rollback planning and known-good baseline preservation.

## Intelligence and autonomy ideas

- Engineering Orchestrator / adaptive orchestrator.
- Solution portfolio: keep multiple viable solution paths rather than committing too early.
- Constraint breaker / impossible-path builder: when a route fails, deliberately search for alternative routes.
- Assumption challenger and uncertainty calibration before high-impact changes.
- Self-evaluating orchestrator: evaluate the quality of its own plan and execution.
- Real behavioral evaluator rather than inventory-only evaluation.
- Failure-to-skill learning loop: convert repeatable failures into new capabilities.
- Skill factory, evolution engine and benchmark loop.
- Capability-gap builder that can create missing capabilities instead of merely reporting them.
- Production simulation and incident/autopilot concepts for later operational maturity.

## Memory and continuity ideas

- Repository memory: preserve architectural discoveries, decisions, known constraints and successful/failed approaches.
- Engineering task memory: preserve the complete lifecycle of each update.
- Evidence ledger: preserve proof, not just conclusions.
- Idea registry: preserve ideas that are intentionally deferred so exploration never loses them.

## Delivery and ecosystem ideas

- GitHub-native maintainer and delivery workflow.
- Cross-agent handoff for specialized agents.
- ChatGPT task bridge for task intake/control.
- Customer-to-code / market-to-repo path for turning real-world requests into repository changes.
- Prior-art and novelty analysis before proposing inventions or unusual implementation paths.
- Real API testing and production-readiness verification.

## Security ideas

- Prompt firewall.
- Security boundary mapping and security audit.
- Secretless integration.
- Minimum tool permissions.
- Dependency risk analysis.
- PR risk gate.
- Security regression tests as part of promotion, not an afterthought.

## Future / deliberately deferred ideas

These remain in the backlog even when they are not needed for the next milestone:

- Continuous post-release observation and release observer.
- Automatic rollback triggered by verified production signals.
- Long-running autonomous maintenance.
- Skill marketplace / capability sharing.
- More advanced benchmark suites across many repository types.
- Multi-agent specialist teams with explicit contracts.
- Human approval policies based on risk level.
- Cost/time optimization of solution-path search.

## Non-negotiable design principles

1. Never claim an update is complete because code was generated.
2. Never mutate the original repository during preview.
3. Never discard a viable alternative path merely because the first path was chosen.
4. Never discard a new idea just because it is not part of the current milestone; record it here.
5. Every promoted update needs reproducible evidence.
6. Failures are inputs to improvement, not reasons to hide the failure.
7. The system must be able to create a solution when the obvious path is blocked.
