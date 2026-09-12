---
name: product-memory
description: Maintain a durable product record across discovery, builds, tests, releases, customers, failures, and improvements so the product system can learn from evidence.
---

# Product Memory

Maintain the canonical state of each product and preserve evidence needed for future decisions.

## Record

Track opportunity, buyer, assumptions, evidence, architecture, versions, acceptance criteria, test results, deployment state, incidents, leads, customer feedback, pricing experiments, and decisions.

## Learning loop

After every meaningful event, classify the result as validated, invalidated, unknown, or changed. Update the next action accordingly.

## Rules

- Never overwrite evidence silently.
- Distinguish facts from hypotheses.
- Keep failed experiments because they prevent repeated mistakes.
- Prefer the newest verified evidence when facts conflict, while preserving the historical record.

## Output

Return current state, confidence, important evidence, unresolved questions, and the highest-value next action.
