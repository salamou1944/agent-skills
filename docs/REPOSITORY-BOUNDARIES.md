# Repository Boundaries

| Repository | Owns | Must not absorb |
|---|---|---|
| `salamou1944/agent-skills` | reusable skills, capability engineering, orchestration, verification, generic adapters | EASY product code, private memory, customer-specific product code |
| `salamou1944/Salamou-31` | sellable APIs, API hub, service offers, commercial experiments | generic operating memory, EASY-specific implementation |
| `salamou1944/Easy-` | EASY product knowledge, EASY API registry, EASY-specific architecture | generic agent skills, unrelated revenue products |
| `salamou1944/AI_operating_memory` | source-of-truth operating rules, evidence ledgers, decisions, cross-repo capability map | application code and secrets |

## Current write-access reality

As of 2026-09-15, the connected GitHub integration has been verified with real write operations in both `salamou1944/agent-skills` and `salamou1944/AI_operating_memory`.

The operating-memory repository now contains the core rules, verification protocol, working method, project boundaries, limitations, decision rules, changelog, and capability map. The generic skill repository now contains the delegated operation skills that implement those rules.

`Easy-` and `Salamou-31` have not been modified in this pass because the current task is to establish the generic delegated-operation layer and its operating memory without mixing project-specific implementation into it.

## Rule

Do not claim a repository was modified unless the GitHub write operation and resulting commit are available as evidence.
