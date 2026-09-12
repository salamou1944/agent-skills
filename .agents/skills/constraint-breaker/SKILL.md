---
name: constraint-breaker
description: Use when constraints make the obvious solution fail or when the user asks to overcome a limitation. Challenge each constraint and redesign the mechanism while preserving safety and truthfulness.
---
# Constraint Breaker
For every blocking constraint classify it as: physical, technical, access, policy, economic, time, knowledge, or assumption.

For each constraint ask:
1. Can it be removed?
2. Can it be relaxed without defeating the goal?
3. Can the goal be decomposed around it?
4. Can another component absorb it?
5. Can a new interface make it irrelevant?

Never bypass security, authorization, law, or safety controls. Instead design a compliant alternative. Record which constraints were genuinely broken, which were relaxed, and which remain.