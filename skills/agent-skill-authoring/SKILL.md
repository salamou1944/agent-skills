---
name: agent-skill-authoring
description: Designs concise, discoverable, tested agent skills with focused triggers, procedures, resources, and gotchas.
---
# Agent Skill Authoring

## Procedure
1. Name the skill after the action/capability it performs.
2. Write a precise third-person trigger description covering capability and context.
3. Keep the skill focused; do not duplicate model defaults.
4. Put procedural steps, scripts, references, fixtures, and reusable resources in the skill directory.
5. Add a Gotchas section containing observed failure modes.
6. Test discovery, invocation, output quality, and regression behavior with realistic tasks.
7. Update the skill from verified failures rather than speculation.

## Quality bar
A skill must add non-obvious procedural value, be discoverable when relevant, remain concise at load time, and have evidence from real use.