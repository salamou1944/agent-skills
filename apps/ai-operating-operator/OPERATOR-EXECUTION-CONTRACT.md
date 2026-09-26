# Operator execution contract

## Runtime loop

1. ChatGPT creates a signed task packet.
2. Operator validates project, requested capabilities, constraints and idempotency.
3. Skill Router selects existing skills from the 80 registered internal skills.
4. Capability Router checks configured/authorized/reachable/operation-tested state.
5. Adapter Registry permits only registered adapters.
6. Executor performs the bounded operation.
7. Evidence Ledger records action evidence without secrets.
8. Independent verifier observes the resulting state.
9. Finalizer returns VERIFIED only when both action and independent verification evidence exist.
10. ChatGPT reviews the evidence and reports the result to the user.

## Important distinction

- skill-registry.json = reusable procedures/source registration.
- capability-registry.json = capabilities and promotion state.
- adapter-registry.json = executable adapters.
- AI_operating_memory = canonical project state.
- Project-/COLLECTION = research/implementation knowledge.
- Astra- / Files- = knowledge/artifact storage.
- A README, token, catalog entry, or skill registration never proves runtime capability.

## Mutation rule

Remote mutation requires explicit authorization, scope, bounded input, idempotency, and (where configured) approval. Security operations require an explicit authorized target scope.

## Evidence rule

A successful adapter call is not completion. Completion requires an independently observed postcondition.
