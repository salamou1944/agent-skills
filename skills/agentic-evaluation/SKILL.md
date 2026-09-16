---
name: agentic-evaluation
description: Evaluates autonomous agents with reproducible tasks, tool failures, adversarial cases, stop conditions, and regression gates.
---
# Agentic Evaluation

## Procedure
1. Define task objective, expected artifacts, invariants, and forbidden outcomes.
2. Build deterministic fixtures for normal and failure paths.
3. Test ambiguous input, malformed data, dependency failure, tool failure, permission denial, context pressure, and recovery.
4. Verify tool arguments, side effects, final artifacts, and user-visible outcomes.
5. Score against explicit acceptance criteria rather than subjective impressions.
6. Preserve failing cases as regression fixtures.

## Quality bar
An agent is not considered reliable because it produces plausible text. Reliability requires reproducible task success, safe failure, correct side effects, and regression evidence.