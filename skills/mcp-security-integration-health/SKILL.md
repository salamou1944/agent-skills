---
name: mcp-security-integration-health
description: Validate security-tool MCP integrations by proving not only connection status but tool discovery and an authorized end-to-end tool invocation. Use for Burp Suite, OpenCode, scanners, and similar MCP-connected security workflows.
---

# MCP Security Integration Health

## Contract

`configure → connect → discover → invoke-safe-test → verify-result → record-evidence`

A green connection indicator is insufficient evidence.

## Required checks

1. **Transport**
   - Confirm the configured MCP transport/endpoint is reachable.
   - Record host, port, transport, protocol version, and timestamp.
2. **Initialization**
   - Confirm the MCP initialize handshake succeeds.
3. **Catalog**
   - Enumerate tools/prompts/resources and verify expected capabilities are present.
4. **Safe invocation**
   - Invoke one deterministic, non-destructive tool against a local fixture or explicitly authorized lab target.
5. **Result integrity**
   - Confirm the client receives a valid MCP result and can map it to the expected tool.
6. **Failure path**
   - Test at least one intentional invalid input and confirm the integration fails safely and observably.
7. **Evidence**
   - Store command/config version, tool name, invocation result, and test target/fixture identifier.
8. **Scope**
   - Security testing must remain restricted to systems for which authorization exists.

## OpenCode + Burp pattern

PortSwigger's current Burp MCP server exposes an MCP endpoint, with the default local endpoint documented as `http://127.0.0.1:9876`. OpenCode supports remote MCP configuration and `opencode mcp list` for connection status. Therefore the integration should be tested beyond a mere `connected` state: enumerate Burp tools and perform a harmless authorized fixture call.

## Guardrails

- Never use the integration to probe third-party systems without authorization.
- Prefer localhost, intentionally vulnerable labs, CTFs with explicit scope, or owned staging systems.
- Do not store credentials or sensitive request/response bodies in evidence.
- Keep provider/tool failures distinct from target/application findings.
- Do not claim a security test succeeded merely because MCP connected.

## Reusable health result

Use one of:

- `PASS`: transport + initialization + expected catalog + safe invocation + result verification passed.
- `BLOCKED`: integration cannot be exercised because a dependency/permission/provider is unavailable.
- `FAIL`: configured integration was exercised and an acceptance criterion failed.

This distinction feeds Elite's existing evidence-driven completion contract.
