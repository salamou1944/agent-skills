---
name: github-wide-discovery
description: GitHub-wide discovery policy that treats Collection as canonical inventory, not the search boundary, and converts global discoveries into deduplicated, verified capabilities.
---

# GitHub-Wide Discovery

## Core Rule

**Collection is the canonical inventory, not the search boundary.**

Collection is what we know; GitHub is the discovery universe. Never stop because a capability is absent from Collection.

## Discovery Universe

Search, according to capability value:

- Collection
- all owned repositories
- all relevant GitHub organizations
- GitHub globally
- repositories, forks, upstreams
- releases, tags, branches, commits
- issues, pull requests
- GitHub Actions and reusable workflows
- gists, packages, examples, templates
- subdirectories and documentation
- related repositories and organizations/accounts
- dependencies and dependents
- integrations
- repositories using or developing the same technology/capability

## Two-Way Discovery

Run both directions:

**Collection → GitHub**
- identify known capabilities, gaps, incomplete accounts, weak Skills, missing alternatives, production blockers, unverified capabilities, and non-instant-use capabilities;
- use those gaps to drive global searches.

**GitHub → Collection**
- search directly for stronger implementations, alternatives, forks, specialized tools, APIs, SDKs, CLIs, MCP servers, Docker services, workflows, deployment templates, testing, extraction, browser automation, AI tooling, provider adapters, observability, artifacts, auth, storage, queues, workflow engines, and revenue infrastructure.

Every useful result follows:

`DISCOVER → EVIDENCE → COMPARE → DEDUPE → PRESERVE → CANONICALIZE`

Never inject raw discovery as a duplicate record.

## Capability-Oriented Search

For every important capability, search multiple dimensions:

1. Exact — project/library/tool name.
2. Functional — what the capability does.
3. Technical — implementation technology.
4. Interface — API / CLI / SDK / MCP / Docker.
5. Alternative — competing solutions.
6. Implementation — different ways to implement it.
7. Integration — integration with current systems.
8. Deployment — production operation.
9. Validation — testing and verification.
10. Cost — free, lower-cost, or self-hosted paths.

## Discovery Loop

`KNOWN CAPABILITY → COLLECTION → OUR GITHUB → GLOBAL GITHUB → ALTERNATIVES → IMPLEMENTATIONS → SMALL ASSETS → COMPARE → DEDUPE → MERGE → STRENGTHEN → INSTALL/ADAPT/ACTIVATE → VERIFY`

Continue while marginal capability value remains material. Do not use result count as the stopping criterion.

## Do Not Stop at the First Good Repository

For a valuable repository, inspect as justified:

- best forks and upstream
- alternatives
- complementary repositories
- plugins and adapters
- surrounding tools
- dependencies and dependents
- successor and maintained alternatives
- focused smaller implementations
- deployment wrappers
- validation tooling

## Small-Asset-First

Search for high-leverage small assets:

- utilities, parsers, extractors, adapters, scripts
- GitHub Actions and workflows
- Dockerfiles/configs
- fixtures and migrations
- CLI wrappers and API clients
- retry/rate-limit/cache implementations
- validation and artifact checkers

A small asset is HIGH-LEVERAGE when it saves substantial work, fixes a production blocker, removes cost/dependencies, provides an integration, improves reliability, or creates an instant-use capability.

## Global Installability Search

For every valuable capability, search for the easiest real operating surface:

- npm, PyPI, Cargo, Go and other package managers
- Docker and binaries
- CLI, API, SDK, MCP
- GitHub Actions
- hosted services
- Vercel integrations
- Railway-compatible deployment
- Supabase integrations

Ready-to-install may be operationally more valuable than source code. Never mark Installed or Activated without evidence.

## Global Deduplication

Compare every discovery against:

- Collection
- canonical Skills
- installed inventory
- capability registry
- active projects
- shelved assets
- existing integrations

Classify:

`NEW`, `DUPLICATE`, `STRONGER_VERSION`, `COMPLEMENTARY`, `ALTERNATIVE`, `UPSTREAM`, `DOWNSTREAM`, `INSTALLABLE_WRAPPER`, `PROVIDER_ADAPTER`, `VALIDATION_ASSET`.

Different names, languages, repositories, package names, or implementation details do not imply different capabilities.

## Canonicalization

**DISCOVER GLOBALLY, CANONICALIZE CENTRALLY.**

Cluster implementations into a canonical capability, select the best implementation(s), and preserve valuable alternatives on SHELF for fallback/future use.

`GITHUB → DISCOVERY → EVIDENCE → COMPARISON → DEDUPE → CAPABILITY CLUSTER → CANONICAL CAPABILITY → BEST IMPLEMENTATION(S) → INSTALL/ACTIVATE → VERIFIED CAPABILITY`

## Search for Better Existing Versions

After every sweep ask:

**Is there anything on GitHub materially better than what we already have?**

Compare functionality, reliability, maintenance, dependencies, performance, license, installation simplicity, API quality, tests, deployment simplicity, security, cost, provider independence, observability, extensibility, and operational complexity.

If better:

`CURRENT + NEW → STRONGER CANONICAL`

Never create a duplicate merely because the source differs.

## Search for Missing Capabilities

Use production blockers as discovery drivers.

If a path such as `API → Provider → Result` lacks retry, queues, artifact verification, rate limiting, provider fallback, timeout control, idempotency, or observability, search GitHub directly for those capabilities.

Then:

`DISCOVER → PRESERVE → COMPARE → DEDUPE → INSTALL/ADAPT → SKILL → VERIFY`

## Recursive Account Frontier

For high-value discoveries, expand selectively:

`Repository → Owner → Organization → Other repositories → Forks → Upstream → Contributors → Related repositories → Dependencies → Dependents → Integrations → Examples`

Do not recurse without value control. Prioritize capability value, production relevance, and novelty.

## Priority

- **P0:** production blocker
- **P1:** instant-use capability
- **P2:** strengthens an existing capability
- **P3:** cost leverage / subscription elimination
- **P4:** reliability, security, testing, observability, recovery
- **P5:** future value
- **SHELF:** valuable but not currently activation-priority

SHELF is a valid outcome.

## Production Feedback

Every discovery must end in:

`USE NOW | INSTALL | INTEGRATE | STRENGTHEN | MERGE | ADAPT | TEST | SHELF | MONITOR | REJECT WITH REASON`

Never stop at `FOUND`. Record:

`FOUND → VALUE → DECISION → STATE → EVIDENCE`

## Preservation

For valuable discoveries preserve:

- provenance and source URL
- repository/path
- commit/revision
- capability and classification
- evidence
- dependencies
- license
- installation method
- relationship to canonical capability
- shelf/reject reason
- activation path

**Preserve once, reuse many times.**

## Evidence and Completeness

Never claim:

- all GitHub was searched
- no alternative exists
- a project is the best
- a solution is unique

unless the search scope and evidence support that claim.

Use:

`SEARCHED`, `PARTIALLY_SEARCHED`, `HIGH-COVERAGE SEARCH`, `CANDIDATE FOUND`, `ALTERNATIVES FOUND`, `NO STRONGER CANDIDATE FOUND IN SEARCHED SCOPE`.

Absence of evidence is not evidence of absence.

## Operating Model

- **Collection** = what we know
- **GitHub** = discovery universe
- **Capability Registry** = what the system can do
- **Skills** = execution interface
- **Capability Factory** = discovery → usable capability
- **Installation Layer** = install → configure → activate
- **Verification Layer** = prove what actually works
- **Production** = real-world evidence
- **Revenue / Outcome** = business proof

Final loop:

`SEARCH GLOBALLY → DISCOVER → PRESERVE → COMPARE → DEDUPE → MERGE → STRENGTHEN → INSTALL/ADAPT → ACTIVATE → VERIFY → RETURN VALUE TO COLLECTION`

**Discover globally. Canonicalize centrally. Preserve valuable alternatives. Activate only when justified. Verify before claiming.**

The goal is not a larger Collection. The goal is the strongest inventory possible, one best canonical capability per function, minimal duplication, maximum reuse, maximum verified instant-use capability, and minimum operating cost.
