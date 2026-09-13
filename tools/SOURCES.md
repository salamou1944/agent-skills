# Trusted Source Set

Seed sources selected for first-pass tool intelligence:

| Source | Trust tier | What we inspect |
|---|---|---|
| OpenAI Agents SDK | A | hosted tools, local execution, function tools, MCP, tool search, sandbox patterns |
| Model Context Protocol official registry | A | published MCP servers, versions, provenance, server metadata |
| MCP official reference servers | A for protocol/reference, not automatic production approval | fetch, filesystem, git, memory, time, sequential thinking |
| LangChain / LangGraph official repositories | A | tool integrations, orchestration, databases, web, APIs |
| GitHub official MCP documentation | A | GitHub toolsets, security boundaries, least-privilege guidance |
| Vendor-owned official repositories/docs | A | first-party integrations and security model |
| Major community registries/directories | B | discovery only; every candidate must be traced to upstream and independently tested |

## Evidence rule

Search results and popularity lists are discovery signals, not approval evidence. A candidate is promoted only after its upstream source, version, license, maintenance, permissions, and executable behavior are inspected.

## Current research evidence

- OpenAI's Agents SDK documents hosted tools, local/runtime tools, function tools, agents-as-tools, MCP, sandbox capabilities, and tool search.
- The official MCP repository identifies reference servers for fetch, filesystem, git, memory, sequential thinking, and time, while warning that they are reference/educational implementations rather than production-ready guarantees.
- The official MCP Registry is the canonical discovery surface for published MCP servers.
- LangChain documents a large integration ecosystem spanning tools, APIs, databases, web data and other agent capabilities.
- GitHub documentation recommends enabling only the toolsets actually needed because fewer tools improve selection accuracy and security.
