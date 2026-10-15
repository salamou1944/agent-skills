---
name: collection-skill-extraction
description: Preflights external Collection sources for license, provenance, dependencies, revisions, reusable small assets, and evidence boundaries before handing them to the canonical Collection Skill Promotion workflow.
---
# External Collection Source Preflight

This Skill is a focused intake stage, not a second promotion pipeline. Use `collection-skill-promotion` for canonical deduplication, synthesis, Skill creation/strengthening, validation, shelving, and promotion.

## Procedure

1. **Pin the source.** Record repository, path, owner, default branch, immutable commit SHA, file blob SHA, retrieval time, and source URL. If the revision cannot be pinned, mark the record provisional.
2. **Resolve licensing before reuse.** Record the repository license and check nested assets, model weights, datasets, generated artifacts, and copied code for separate terms. Missing or `NOASSERTION` licenses mean preserve for research but block copying, packaging, or installation until clarified.
3. **Inspect implementation, not only the README.** Read the actual entrypoint, package/build manifests, dependency declarations, tests, workflows, security configuration, and relevant source files. Preserve useful small assets: scripts, adapters, schemas, fixtures, migration files, CLI wrappers, workflow fragments, and negative tests.
4. **Record operational boundaries.** Identify runtime/OS, required services, secrets, network access, provider/API requirements, quotas, external storage, data handling, and security permissions. Never copy credentials or infer free production capacity from a README.
5. **Classify without promoting.** Choose among reusable procedure, project, component, adapter, tool/service, validation asset, fixture, reference/pattern, alternative, upstream, downstream, or negative finding. Record both Skill value and independent-project value.
6. **Compare for semantic overlap.** Search canonical Skills and Collection records by execution boundary and user outcome, not just name. Preserve source provenance even when another implementation is stronger. Do not create a Skill or merge sources in this intake stage.
7. **Capture evidence and negative findings.** Distinguish discovered, source-inspected, upstream-CI-passed, locally-tested, installed, runtime-proven, and production-proven. Record failed checks, stale revisions, placeholders, missing tests, and blocked access rather than suppressing them.
8. **Hand off for synthesis.** Pass the structured source record to `collection-skill-promotion`. Extract or strengthen a canonical Skill only after overlap analysis and task-specific validation; keep unactivated valuable assets on shelf.

## Output contract

Every intake record should include:
- source URL, owner/repository/path, immutable revision and blob SHA;
- retrieval timestamp, license evidence, dependency/runtime summary;
- reusable assets and their exact source paths;
- tests/CI evidence with commit and run identifiers when available;
- security, cost, quota, and operational constraints;
- negative findings, unknowns, and blockers;
- semantic-overlap candidates and the intended canonical handoff;
- separate preservation, readiness, and activation decisions.

## Completion rule

Source intake is complete when provenance, license status, reusable assets, evidence level, and blockers are recorded. This does **not** mean the source is installed, a Skill is promoted, or any capability is runtime- or production-proven.
