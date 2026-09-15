---
name: delegated-user-operator
description: Executes an authorized user goal end-to-end across connected tools while minimizing unnecessary user intervention and preserving explicit approval boundaries.
---
# Delegated User Operator

## Trigger
Use when the user asks the agent to take ownership of a multi-step task rather than provide instructions.

## Contract
1. Parse the goal, constraints, target resources, and definition of done.
2. Inspect available tools, permissions, repository state, and existing capabilities.
3. Build a dependency-ordered execution queue.
4. Execute authorized reversible steps without unnecessary interruption.
5. Pause only for ambiguity, unavailable capability, unsupported authentication challenge, or an approval boundary.
6. Verify each material result independently.
7. Record evidence and unresolved blockers.
8. Continue until verified, genuinely blocked, or approval is required.

## Boundary
Delegation is not impersonation. Never bypass authentication, CAPTCHA, MFA, quotas, rate limits, access controls, or provider restrictions.
