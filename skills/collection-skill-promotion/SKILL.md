---
name: collection-skill-promotion
description: Discover reusable assets, preserve independent projects, deduplicate against existing skills, extract canonical Agent Skills, validate them, and advance retained assets toward real operational readiness. Use for Collection-to-Skills work.
license: MIT
---

# Collection Skill Promotion
This is the canonical operating rule for converting Collection findings into reusable Skills without losing independent projects.

## Canonical pipeline
**Discover → Preserve → Evaluate both axes → Inventory → Deduplicate → Synthesize → Extract/Strengthen Skill → Validate → Prepare/Prove → Shelf → Promote/Activate**

### 1. Discover
- Enumerate the complete source account/repository scope before narrowing to current-project relevance.
- Follow newly discovered parent accounts, forks, source references, collection indexes, and dependencies recursively.
- Never treat a README claim as runtime proof.

### 2. Preserve
For every retained source, preserve:
- original repository/path and immutable ref when available;
- license and relevant dependency/model-license constraints;
- provenance/evidence;
- independent ready-made or near-ready project potential;
- useful components, adapters, schemas, fixtures, prompts, workflows, tests, patterns, references, and implementation details.

**Not needed now is not the same as not valuable.** Small reusable material is preserved because later synthesis may make it valuable.

Preservation is non-terminal: retained material remains searchable and reusable unless explicitly rejected for a documented reason.

### 3. Evaluate both axes independently
Before deduplication or project mapping, evaluate:
1. **Skill material** — reusable procedures, workflows, operational knowledge, adapters, validation patterns, or other non-obvious instructions.
2. **Independent project potential** — standalone or near-standalone product/service/utility potential.
A negative Skill result must never discard a positive independent-project result. A reusable Skill result must not cause the original project to be discarded.

### 4. Inventory retained value
Classify retained material without creating a parallel readiness system:
- canonical Skill material;
- component/pattern;
- adapter/integration;
- fixture/test/evidence asset;
- reference/knowledge asset;
- ready or near-ready project;
- other preserved asset with explicit reuse potential.

Record when applicable: `value_class`, `artifact_kind`, `preservation_status`, existing readiness state, provenance, reuse targets, known gaps/blockers, and activation trigger.

The inventory is a **stock of reusable assets**, not merely a list of activated capabilities.

### 5. Deduplicate before creating a Skill
- Search agent-skills/skills by exact name **and semantic purpose**.
- Prefer strengthening one canonical Skill over creating overlapping Skills.
- If an existing Skill already covers the material, extend it with verified new evidence rather than creating a second Skill.
- Preserve provenance when multiple sources contribute to one Skill.
- Do not create a new Collection rule when an existing canonical rule can be strengthened.
- When multiple retained Skills are semantically overlapping, form a **merge cluster** before promotion: combine all unique contracts, constraints, verification rules, and provenance into one stronger canonical Skill; do not discard a source merely because its name or implementation overlaps.
- After a merge cluster is validated, retire superseded duplicate Skill entries only after auditing repository references, self-tests, workflows, and discovery metadata; preserve their unique material and provenance inside the composite Skill.
- Prefer **N inputs → 1 stronger canonical Skill** when the inputs share the same execution boundary or user outcome. Keep Skills separate only when their trigger, ownership, inputs/outputs, safety boundary, or verification contract is materially distinct.

### 6. Synthesize stronger assets
Collection is not complete when material has merely been catalogued.

When multiple retained inputs solve complementary parts of the same problem:
- combine their unique contracts, constraints, procedures, tests, adapters, and evidence;
- produce one stronger canonical Skill/component/project where the execution boundary is shared;
- preserve every contributing source and its provenance;
- retain unique material even when it is not used by the first synthesis;
- record the resulting asset as a derived/merged asset so future work can reuse the stronger result;
- prefer composition over wholesale copying.

A synthesis is not production-ready unless its own verification contract is satisfied.

### 7. Extract the Skill
- Extract the smallest useful reusable procedure.
- Create/update skills/<lowercase-hyphen-name>/SKILL.md.
- Do not copy an application wholesale into a Skill.
- Keep instructions focused and actionable; move substantial references/scripts into bundled resources when needed.
- The Skill is the reusable instruction/workflow unit; the repository remains separately classified as a project/component/etc.

### 8. Validate
Use the existing evidence-driven evaluation layer:
- structural: frontmatter, naming, scope, references;
- routing: discoverability and collision with neighboring Skills;
- behavioral: execute the workflow against a deterministic or safe realistic scenario;
- artifact: inspect the actual Skill and produced output;
- regression: rerun relevant adjacent tests.
A Skill is not considered verified merely because the file exists.

### 9. Make retained assets work-ready
For worthwhile P0/P1 retained assets, continue beyond cataloguing when technically and legally possible:
- inspect exact entrypoint/runtime/config/dependencies;
- materialize minimum free/existing dependencies;
- adapt only as needed;
- run deterministic tests and real smoke/runtime proof;
- produce a reproducible deployment path where appropriate;
- record exact blockers when credentials, credits, network, provider, or host runtime prevents proof.
Use existing Collection work-ready infrastructure and evidence records. Do not create a parallel readiness taxonomy.

### 11. Promotion and evidence
Allowed states include: READY_TO_USE, READY_TO_DEPLOY, PRODUCTION_VERIFIED, BLOCKED, REJECTED.
Never promote from configuration, inspection, or workflow creation alone. BLOCKED remains BLOCKED; never weaken an assertion to manufacture PASS.

### 10. Shelf and future activation
**ON-SHELF means paused, retained, searchable, and reusable — never discarded.**

For worthwhile inactive assets, retain current readiness, gaps/blockers, provenance, likely reuse targets, and activation triggers. When a new project or revenue opportunity appears, search the shelf before implementing from scratch. Ready or near-ready projects may be completed by combining existing Skills, components, adapters, infrastructure, fixtures, and other prepared assets.

Revisit shelved material when an activation trigger matches a current need, dependencies become available, or a stronger synthesis becomes possible.

## Non-negotiable separation
**Collection discovery, Skill extraction, and independent-project preservation are three related but distinct decisions.**
The same repository may simultaneously contribute material to a Skill, remain preserved as an independent READY_PROJECT/REVENUE_ASSET, and provide a component or reference.
Deduplication applies to the reusable Skill layer, not to provenance or independent-project preservation.

## Completion rule
Collection-to-Skill work is complete only when the reusable material has either been merged into an existing canonical Skill with provenance and validation evidence, or been rejected/blocked with an explicit reason.
Independent project candidates remain preserved even when their Skill extraction is negative.

**Canonical flow:** Discover → Preserve → Evaluate both axes → Inventory → Deduplicate → Synthesize → Extract/Strengthen → Validate → Prepare/Prove → Shelf → Promote/Activate.
