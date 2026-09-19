# AI Autonomous Evolution Loop

Research -> Hypothesis -> AI Mutation -> Population/Planner -> Sandbox -> Verification -> Falsification -> Confidence -> Promotion Gate -> Evidence.

The model is not allowed to directly write production state. AI output is an untrusted mutation plan. The sandbox validates paths, isolates the working tree, executes only allowlisted local test files, and destroys the workspace after each experiment.

Promotion is fail-closed: a successful experiment is evidence of a candidate, not permission to ship. Independent evaluator separation, repeated trials, harness stability, security checks, and evidence artifacts remain mandatory.

Provider exhaustion is recorded as AI_BLOCKED; the system never fabricates a mutation or a passing result.
