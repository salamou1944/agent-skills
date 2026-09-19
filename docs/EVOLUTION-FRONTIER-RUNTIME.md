# Evolution Frontier Runtime

This layer turns the Evolution contract into a bounded research-to-verification loop:

`Observe → Discover Gap → Generate Mutations → Isolated Sandbox → Deterministic Test → Adversarial Check → Single Survivor → Independent Replay → Learn From Rejection`

## Components

- `evolution-research.mjs`: deterministic capability-gap discovery. It records the exact baseline revision and explicit missing runtime layers.
- `evolution-mutation-generator.mjs`: provider-backed candidate generation. The generator is not a verifier and cannot promote a candidate. Candidate IDs and mutation fingerprints must be unique.
- `evolution-orchestrator.mjs`: immutable-baseline competition in isolated clones. It fails closed unless exactly one candidate survives. Candidate diffs receive SHA-256 bindings.
- `evolution-independent-verifier.mjs`: fresh-clone replay of the recorded survivor. It checks the baseline again, replays the candidate, repeats the checks, compares the recorded diff hash, and records the verifier module hash.
- `evolution-negative-knowledge.mjs`: append-only JSONL rejection ledger with a SHA-256 hash chain.
- `evolution-frontier.mjs`: end-to-end coordinator. Successful runs persist a result artifact; rejected runs are recorded as negative knowledge.

## Trust boundaries

1. Provider output is untrusted input.
2. Verification commands are trusted configuration owned by the coordinator; provider output cannot supply the verification command set.
3. Candidate changes cannot target `.github/workflows/`, absolute paths, traversal paths, or forbidden credential paths enforced by the mutation/orchestrator layers.
4. The generator cannot declare a winner.
5. The orchestrator cannot promote zero or multiple survivors.
6. The independent verifier starts from a fresh clone at the exact recorded baseline.
7. Evidence is bound to the baseline revision, candidate diff hash, and verifier implementation hash.
8. A synthetic pass is not a production or revenue claim.

## What this still does not claim

- It does not claim autonomous production deployment.
- It does not claim revenue.
- It does not make an LLM-generated acceptance test trustworthy merely because the LLM generated it.
- For high-assurance tasks, the acceptance tests should come from a trusted task manifest or held-out verifier environment outside the mutation workspace.

That last boundary is intentional: current agent-evaluation practice increasingly separates agent execution from clean, programmatic verification, including immutable baselines and fresh verifier environments. The repository should preserve that separation rather than allowing the agent to author its own grading oracle.

## Reproducibility

A successful result contains:

- experiment ID
- project ID
- immutable baseline revision
- survivor ID
- orchestrator evidence hash
- independent evidence hash
- independent verifier module SHA-256
- discovered capability gaps

A rejection is retained in `evolution/negative-knowledge.jsonl` and linked to the preceding ledger entry through `prev_hash`.

## Operational rule

Promotion is evidence-driven and fail-closed. If the system cannot establish the required evidence, it must record the failure and stop rather than convert uncertainty into a completion claim.

## Evaluation integrity

A PR check is evidence about the exact checked revision only. Stale merge refs or failed checks are never treated as verification of a newer branch head. The coordinator must bind conclusions to the checked commit SHA and rerun after a revision change.
