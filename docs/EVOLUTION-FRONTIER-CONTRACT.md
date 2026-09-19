# Evolution Frontier Contract

## Mission

Evolution is a controlled software-engineering improvement loop, not an unrestricted self-modifying agent.

`Observe → Research → Discover Gap → Hypothesize → Generate Mutations → Sandbox → Attack → Verify → Learn → Promote → Deploy → Observe Again`

## Invariants

1. Every experiment names exactly one project and one immutable baseline revision.
2. Candidate generation is separate from verification and promotion.
3. Candidate workspaces are isolated from the baseline.
4. Provider output is untrusted input.
5. Credential, workflow, traversal, and project-boundary violations fail closed.
6. Verification configuration is owned by the coordinator; a model cannot author its own grading oracle.
7. Promotion requires exactly one survivor plus independent replay evidence.
8. Evidence binds the baseline revision, candidate mutation hash, and verifier identity.
9. Failed candidates and rejected hypotheses are retained as negative knowledge.
10. Synthetic verification never becomes a production, customer, or revenue claim.
11. A missing evidence condition stops the pipeline rather than being converted into a success state.

## Evidence levels

- **L0 — hypothesis:** idea or suspected gap.
- **L1 — implementation:** code exists.
- **L2 — deterministic verification:** repository-local tests/checks pass.
- **L3 — independent verification:** a fresh environment reproduces the result.
- **L4 — repeated/adversarial verification:** the result survives multiple controlled attacks or repeated trials.
- **L5 — deployed observation:** authorized runtime evidence confirms the behavior in the target environment.

Only the evidence actually produced by the run may advance a task's evidence level.

## Boundary model

The architecture follows a separation used by mature coding-agent systems: the agent proposes actions, a runtime executes them in an isolated environment, and verification is a distinct stage. OpenHands documents explicit Agent/Controller/Runtime/Sandbox boundaries, while SWE-agent emphasizes sandboxed execution, configurable agent-computer interfaces, and separate evaluation workflows. The Evolution implementation adopts those architectural ideas without claiming equivalence to those systems.

## Promotion rule

`PROMOTE` is an evidence decision, not an LLM opinion.

A candidate is promotable only when:
- its baseline matches the experiment baseline;
- its changes pass path and content policy;
- trusted verification checks pass;
- adversarial checks pass;
- exactly one candidate survives;
- a fresh verifier reproduces the survivor and its diff hash;
- the verifier identity is recorded.

If any condition is missing, the experiment is rejected and the reason enters the negative-knowledge ledger.
