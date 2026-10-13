---
name: agent-skill-authoring
description: Designs concise, discoverable, tested agent skills with focused triggers, procedures, resources, and gotchas.
---
# Agent Skill Authoring

## Procedure
1. Name the skill after the action/capability it performs.
2. Write a precise third-person trigger description covering capability and context.
3. Keep the skill focused; do not duplicate model defaults or create semantic duplicates of existing canonical skills.
4. Put procedural steps, scripts, references, fixtures, and reusable resources in the skill directory.
5. Add a Gotchas section containing observed failure modes.
6. Test discovery, invocation, output quality, and regression behavior with realistic tasks.
7. Update the skill from verified failures rather than speculation.
8. Preserve provenance, license, source revision, and validation evidence for imported material.

## MCP Skills extension interoperability

When a skill is published or consumed through MCP, use the official [Skills extension specification](https://github.com/modelcontextprotocol/ext-skills/blob/main/specification/stable/skills.mdx) as the transport contract. This extension does not redefine the Agent Skills file format.

- A server declaring `io.modelcontextprotocol/skills` MUST also declare `resources` and implement `skills/list` and `skills/get`. Implement `resources/directory/read` only when `directoryRead: true` is declared.
- Require a root `SKILL.md` with valid YAML frontmatter containing `name` and `description`. The skill directory/path identity must agree with the frontmatter name.
- Preserve the verbatim frontmatter and publish a complete resource manifest. Verify each resource's raw-byte SHA-256 digest and byte size before use; re-check identity/frontmatter before loading.
- Retrieve files progressively when needed. Do not prefetch skill files. Do not read resources outside the published entry or silently cross server-origin boundaries.
- A nested `SKILL.md` is supporting content until separately published and activated as a skill. Activation of a nested skill requires fresh, explicit consent.
- Validate interoperability against the official [MCP conformance framework](https://github.com/modelcontextprotocol/conformance) and the negotiated protocol revision. Include negative controls that prove invalid digests, sizes, frontmatter, unlisted resources, and unsupported capabilities are rejected rather than merely skipped.

For connection/catalog/invocation health checks, reuse the existing `mcp-security-integration-health` skill rather than duplicating its transport workflow.

## Quality bar

A skill must add non-obvious procedural value, be discoverable when relevant, remain concise at load time, and have evidence from real use.
