# Researched Agent Capabilities

This capability set was strengthened using current primary documentation and engineering guidance from major agent platforms and open standards. It is a capability synthesis, not a claim that every internet source was exhaustively indexed.

## Capability findings

- **Dynamic, focused skills:** skills should be discoverable, concise, action-oriented, and loaded when relevant; procedural workflows belong in skills rather than always-on instructions.
- **Skill authoring:** effective skills package instructions plus scripts/resources where useful, include observed gotchas, and are tested with real usage.
- **Agent orchestration:** agents can delegate to other agents as tools, use handoffs, guardrails, sessions, and structured outputs.
- **Tool surfaces:** hosted tools, local execution, function tools, agent-as-tool patterns, MCP, sandbox capabilities, and deferred tool search can be combined according to trust boundaries.
- **MCP safety:** servers/tools must be trusted, permissions least-privilege, credentials kept out of URLs/logs/prompts, and sensitive actions approved.
- **Browser/runtime verification:** real runtime behavior must be checked; rendering/build success alone is insufficient.
- **Context management:** long-running agents need bounded context, checkpoints, resumable state, and selective loading of skills/resources.
- **Agent evaluation:** autonomous systems require reproducible tasks, failure/adversarial cases, explicit stop conditions, side-effect verification, and regression fixtures.

## Primary sources reviewed

- Anthropic — Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic — Lessons from building Claude Code skills: https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills
- Anthropic — Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic — Claude Code best practices: https://code.claude.com/docs/en/best-practices
- OpenAI Agents SDK — tools: https://openai.github.io/openai-agents-python/tools/
- OpenAI Agents SDK — agents: https://openai.github.io/openai-agents-python/agents/
- OpenAI Agents SDK — MCP: https://openai.github.io/openai-agents-python/mcp/
- Vercel — Agent Skills: https://vercel.com/docs/agent-resources/skills
- Vercel — AI SDK skill uploads: https://vercel.com/kb/guide/ai-sdk-skill-uploads
- GitHub — Agent Skills: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills

## Applied repository changes

New reusable skills were added under `skills/`:
- `agentic-orchestration`
- `agent-skill-authoring`
- `mcp-tool-safety`
- `agentic-evaluation`
- `browser-runtime-verification`
- `context-and-checkpointing`

The 14 soldier definitions now include stronger role-specific execution loops, verification requirements, agent/tool boundaries, and researched capability areas. Completion remains subject to repository-native CI/runtime verification.