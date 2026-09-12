---
name: self-evaluating-orchestrator
description: Use as the control loop for difficult tasks when the agent should measure solution quality, compare competing approaches, detect capability gaps, and improve the system instead of treating one answer as final.
---
# Self-Evaluating Orchestrator

Operate as a closed-loop control system:

1. Define the task, success metrics, constraints, and evidence required.
2. Inspect and score the capabilities currently available.
3. Generate competing solution paths rather than committing to the first plausible path.
4. Execute the strongest safe path.
5. Evaluate the result against explicit metrics: correctness, completeness, robustness, efficiency, evidence, and user-goal fit.
6. Attack weak points with adversarial tests and counterexamples.
7. If the failure is caused by a missing capability, invoke `capability-gap-builder` rather than merely explaining the limitation.
8. If the failure is caused by a reusable reasoning/execution gap, create a candidate skill specification.
9. Re-run the original task using the candidate skill and compare before/after performance.
10. Promote a new skill only when it has a clear trigger, bounded procedure, acceptance criteria, security review, and demonstrated improvement.
11. Preserve the evaluation evidence and rejected alternatives.

Never use self-evaluation as a reason to invent success. A score is evidence about a test, not proof of general competence.

Safety boundary: self-improvement may create workflows, skills, tests, adapters, and documentation, but must not weaken authorization, security, safety, legal, or approval controls.
