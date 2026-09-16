---
name: agentic-eval
description: Evaluate AI-agent behavior with concrete acceptance tests, failure cases, tool-boundary checks, and regression criteria.
---

# Agentic Evaluation

Evaluate an agent as a system, not just as generated text.

## Procedure
1. Define the task and observable success criteria.
2. Identify required tools, permissions, files, and external dependencies.
3. Test the happy path.
4. Test realistic failure paths: missing files, denied permissions, malformed input, unavailable service, and partial failure.
5. Verify the agent does not claim actions it could not perform.
6. Verify outputs and side effects against the acceptance criteria.
7. Record reproducible evidence and regression checks.

## Pass criteria
A scenario passes only when behavior is observable and reproducible. A written plan, plausible output, or prior success is not evidence of execution.

## Guardrails
Do not bypass authentication, quotas, rate limits, or approval gates to create a test condition.
