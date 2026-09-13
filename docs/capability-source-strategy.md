# Capability Source Strategy

The engineering system must not treat GitHub as its only capability source. It uses multiple public ecosystems as discovery inputs and converts their entries into a common `Capability Candidate` model.

## Current source set

| Source | Kind | Role | Why it matters |
|---|---|---|---|
| MCP Registry | MCP | Primary | Official MCP server registry and cursor-paginated metadata |
| skills.sh | Skills | Primary | Search, curated/official set, install telemetry and audit endpoint |
| SkillsMP | Skills | Primary | Large indexed catalog with REST API and filters |
| Glama | MCP | Primary | Large MCP aggregator with quality/safety signals |
| Smithery | MCP | Secondary | MCP discovery plus runtime/deployment ecosystem |
| LobeHub | Mixed | Secondary | Skills + agents + MCP ecosystem |
| PulseMCP | MCP | Secondary | MCP discovery/curation |
| Agensi | Mixed | Secondary | Skills/MCP ecosystem with security-oriented signals |
| Anthropic Skills | Skills | Reference | High-trust first-party/reference collection |
| GitHub | Mixed | Execution | Source code, skills, APIs, CI and PR delivery |

## What is actually extracted

The discovery engine currently performs live retrieval from the sources that expose stable public APIs needed for automated ingestion:

- `skills.sh` search API for targeted capability queries.
- `SkillsMP` REST search API for targeted capability queries.
- Official MCP Registry server API for MCP candidates.

The other sources remain registered as enrichment/discovery sources. They are not scraped blindly. A source is promoted to automated ingestion only when its interface and usage policy support reliable integration.

## Quality selection policy

Discovery volume is not quality. Every candidate is ranked using:

1. **Relevance (45%)** — match between requested capability and name/description.
2. **Popularity (25%)** — install signal when the source exposes one.
3. **Source trust (20%)** — baseline trust assigned to the source.
4. **Official/first-party signal (10%)** — vendor-maintained/reference skills get a bonus.
5. **Duplicate penalty** — known duplicate/fork entries are down-ranked and cannot be promoted directly.

This is only a **discovery score**. A high score never authorizes execution.

## Mandatory promotion checks

Before a candidate becomes an executable capability, the engineering core must additionally verify:

- security/static analysis,
- license and provenance,
- compatibility with the target repository,
- behavioral correctness,
- dependency and network requirements,
- least-privilege boundaries,
- isolated sandbox execution,
- regression impact,
- reproducible evidence.

## Capability model

```text
External Source
      ↓
Capability Candidate
      ↓
Normalize + Deduplicate
      ↓
Rank
      ↓
Security / Provenance
      ↓
Compatibility
      ↓
Sandbox Evaluation
      ↓
Behavioral Evidence
      ↓
Promoted Capability
```

## Important distinction

A Skill is procedural knowledge. An MCP server is an executable tool interface. An API is a service interface. The engineering system should unify them at the **capability layer**, while retaining their execution-specific security and lifecycle rules.

## Next integration layer

The next core work should consume `capability-catalog.json` from `scripts/capability-discovery.mjs` and let the Capability Resolver choose candidates for a normalized Change Request. Missing capability must become a capability gap and may route to the existing Skill Factory / Solution Creator path rather than stopping at "not found".
