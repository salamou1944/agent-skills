# Repository Boundaries

| Repository | Owns | Must not absorb |
|---|---|---|
| `salamou1944/agent-skills` | reusable skills, capability engineering, orchestration, verification, generic adapters | EASY product code, private memory, customer-specific product code |
| `salamou1944/Salamou-31` | sellable APIs, API hub, service offers, commercial experiments | generic operating memory, EASY-specific implementation |
| `salamou1944/Easy-` | EASY product knowledge, EASY API registry, EASY-specific architecture | generic agent skills, unrelated revenue products |
| `salamou1944/AI_operating_memory` | source-of-truth operating rules, evidence ledgers, decisions, cross-repo capability map | application code and secrets |

## Current write-access reality

As of 2026-09-15, the connected GitHub integration successfully writes to `salamou1944/agent-skills`. Attempts to create files in `salamou1944/Easy-`, `salamou1944/Salamou-31`, and `salamou1944/AI_operating_memory` returned HTTP 403 `Resource not accessible by integration` despite repository metadata showing admin permission for the user. Therefore no claim should be made that cross-repository writes were completed.

## Required recovery

Connect/authorize those repositories for the GitHub integration with write permission, then replay the queued files without changing repository boundaries.
