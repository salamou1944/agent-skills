# Knowledge Route Discovery

## Purpose
Find the shortest proven path from a user goal to an executable, verifiable outcome using existing Skills, Collection provenance, operating memory, project assets, and available tools.

## Trigger
Use when a task may already have an existing Skill, reusable implementation pattern, free/local route, provider alternative, or previously verified solution.

## Operating contract
1. Normalize the request into a concrete outcome and constraints.
2. Search canonical Skills before proposing a new capability.
3. Search AI Operating Memory for verified decisions, routes, evidence, and project boundaries.
4. Search Collection only as provenance/discovery input; never treat Collection evidence as execution proof.
5. Build candidate routes using existing assets first.
6. Prefer, in order:
   - verified existing Skill/asset;
   - verified upgrade/merge of an existing Skill;
   - verified free/local/provider-neutral route;
   - new implementation only when the above do not close the gap.
7. Score candidates by evidence strength, compatibility, cost, risk, complexity, and expected time-to-outcome.
8. Reject routes that require bypassing authentication, quotas, permissions, safety controls, or other protections.
9. Execute only within the owning repository boundary.
10. Verify the selected route independently and record evidence.
11. Record reusable successful routes so future tasks can reuse them instead of rediscovering them.

## Route result
Return:
- goal/outcome
- constraints
- selected route
- alternatives considered
- reused Skills/assets
- required tools/permissions
- execution owner
- verification method
- evidence references
- unresolved blockers

## Anti-duplication
Do not create a new Skill merely because a capability has a new name. Compare semantic purpose, inputs, outputs, constraints, verification, and provenance against canonical Skills first.

## Safety
Collection is a discovery/provenance source. Dangerous or restricted capabilities remain knowledge-only or quarantined and must not become executable routes without the required authorization and safety gates.
