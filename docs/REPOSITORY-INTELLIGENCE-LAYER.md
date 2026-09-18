# Repository Intelligence Layer

## Purpose
The repository itself should be treated as a continuously-derived source of architectural knowledge.

The layer is inspired by Litho (sopaco/deepwiki-rs): static code analysis + relationship extraction + AI-assisted explanation + generated architecture documentation. Public documentation describes Context, Container, Component and Code-level documentation, external PDF/Markdown/SQL context, database diagrams, Git-history analysis and CI integration.

## Why this belongs in the larger system
The 14-agent/Elite control plane needs reliable knowledge of what exists, how components depend on each other, which files implement capabilities, what changed, what documentation is stale, and which architectural assumptions are no longer true.

This is not merely documentation. It is a repository-intelligence substrate for planning, verification, security review, change-impact analysis and onboarding.

## Design
1. Inventory: deterministic inventory of repositories, directories, files, languages, manifests, workflows, services, schemas and deployment configuration.
2. Structural graph: extract imports, package dependencies, API routes, service boundaries, database relations, workflow dependencies and cross-repository links where evidence exists.
3. Four architectural views: Context, Container, Component and Code.
4. Evidence-first documentation: every generated architectural statement retains source path, commit SHA, extraction method, timestamp and confidence.
5. External context: optional PDF, Markdown and SQL knowledge sources; external material is context, not authoritative code truth.
6. Temporal architecture: use Git history to produce architecture diffs.
7. Drift detection: detect removed components, invalid diagram references, undocumented high-impact services, stale generated docs and contradictory metadata.
8. CI gate: documentation generation is reproducible and tied to the exact commit.

## Relationship to SNIPER
SNIPER detects the first unexplained deviation. Repository Intelligence supplies the structural baseline and historical context needed to interpret it.

Example signal chain: new dependency -> new workflow permission -> changed deployment -> new network destination.

A single signal is not proof of compromise; the architecture graph makes the chain observable and reviewable.

## Relationship to Elite / ARMY-14
Agents should query this layer instead of repeatedly rediscovering repository structure.

Useful capabilities: impact analysis before edits; dependency-aware planning; verification of claimed changes; architecture-aware test selection; security boundary discovery; regression localization; documentation generation; change explanation.

## Adoption rule
Do not blindly copy Litho or any external implementation. Use external projects as capability references and benchmarks. Re-implement only what is justified by our requirements, license constraints, security model and verification evidence.

## Benchmark target
Evaluate structural accuracy, relationship recall, provenance completeness, stale-document detection, architecture-diff accuracy, reproducibility, runtime/cost and resistance to hallucinated relationships.

## External reference
https://github.com/sopaco/deepwiki-rs