# Trusted Source Set

We use a source hierarchy. Discovery does not equal approval.

| Source | Trust | Role |
|---|---|---|
| OpenAI Agents SDK | A | first-party tool patterns, tool search, sandbox, MCP, runtime execution |
| Official MCP Registry | A | canonical discovery metadata for published MCP servers |
| Official MCP specification | A | protocol/schema/security contract |
| Official MCP reference servers | A for reference implementations; not automatic production approval | fetch, filesystem, git, memory, time and related examples |
| LangChain / LangGraph official repositories | A | ecosystem integrations and orchestration patterns |
| GitHub official MCP documentation | A | GitHub integrations and least-privilege/security guidance |
| Vendor-owned official repositories/docs | A | first-party integrations |
| Major community registries | B | discovery only; upstream provenance and independent tests required |

## Admission rule

A tool is **candidate** until all of these are evidenced:

1. upstream provenance;
2. maintained/versioned source;
3. license identified;
4. permissions and network scope inspected;
5. executable behavior tested;
6. failure behavior tested;
7. secrets handling inspected;
8. human approval required for sensitive actions where applicable.

Candidates never become executable merely because they are popular or listed in a registry.

## Primary references

- OpenAI Agents SDK tools: https://openai.github.io/openai-agents-python/tools/
- OpenAI Agents SDK MCP: https://openai.github.io/openai-agents-python/mcp/
- MCP specification tools: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- Official MCP Registry: https://registry.modelcontextprotocol.io/
- Official MCP Registry API: https://github.com/modelcontextprotocol/registry

## Monitoring rule

The source monitor checks the official registry/protocol surfaces periodically. A failed monitor or tool test is recorded as a capability deficit; it is never silently converted into success. New tools enter the registry as candidates and require admission before production selection.
