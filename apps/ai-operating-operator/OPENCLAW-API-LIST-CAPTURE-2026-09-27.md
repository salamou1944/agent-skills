# cporter202/openclaw-api-list — Operator Capture 2026-09-27

## Evidence
Inspected upstream OPENCLAW_FOCUS.md and OPENCLAW_RECOMMENDED.md. The source is a discovery catalog for agent-callable REST APIs, MCP servers, webhooks and integrations. It explicitly separates discovery from executable use and recommends starting from a curated subset before expanding.

## Selected leverage
- API/MCP discovery remains DISCOVERY until candidate-specific docs, license/terms, cost/quota, security, reachability, operation test and independent verification pass.
- OpenAPI-to-MCP is a useful pattern for bounded tool generation, but imported operations must be explicitly allowlisted.
- MCP can be treated as a registered capability transport with server/version/tool-schema/provenance/permission evidence.
- Useful families include research/search, browser automation, documents, developer/API docs, automation/webhooks, CRM/support, ecommerce, analytics/SEO and video/transcript extraction.
- Prefer self-hosted/free/native alternatives before paid actors.
- Many curated links point to Apify actors with affiliate referral parameters; catalog presence is not vendor validation or proof of free access.

## Operator boundary
No mass import or arbitrary execution. No credential extraction, auth bypass, CAPTCHA/MFA bypass, unrestricted remote execution, arbitrary provider activation or payment authorization. Future adapters inherit allowlists, bounded retries/timeouts, idempotency, redacted evidence, independent verification and fail-closed external dependency handling.

Status: VERIFIED_SOURCE_CAPTURED; DISCOVERY_SOURCE_ONLY.
