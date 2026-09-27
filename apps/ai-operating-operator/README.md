# AI Operating Operator

ChatGPT-mediated execution layer: ChatGPT -> Operator -> authorized applications/tools -> evidence -> ChatGPT -> user.

The operator uses only credentials explicitly supplied to its runtime. It never bypasses authentication, MFA, CAPTCHA, quotas, RBAC, licensing, or payment.

State: REQUESTED -> AUTHORIZED -> PLANNED -> EXECUTING -> EVIDENCE_CAPTURED -> VERIFIED.
Explicit failure states: AUTH_REQUIRED, BLOCKED_PERMISSION, BLOCKED_EXTERNAL_DEPENDENCY, REVIEW_REQUIRED, VERIFICATION_FAILED, FAILED.

Reuse-first: existing Control Plane, evidence gates, delegated-user operator, permission-aware execution, browser/API skills, recovery/regression, Project-/COLLECTION, Astra-/Files-, and verified free/open-source/provider research.

Discovery is never runtime capability. A capability must be configured, authorized, reachable, and operation-tested before it is treated as available.

## Continuous runtime

Start with:

node apps/ai-operating-operator/runtime.mjs

The runtime stays alive and refreshes the five pinned capability sources continuously. A failed refresh never replaces the last successful snapshot.

Primary sources:
1. Agent Zero
2. OpenClaw API List
3. agentic-ai-apis
4. AI Engineering From Scratch
5. awesome-free-llm-apis

Default refresh interval: 15 minutes, with a 60-second minimum.

Endpoints:
- GET /health
- GET /ready
- GET /v1/sources
- GET /v1/search?q=...

The feed is read-only and does not require paid API subscriptions.

External credentials and write permissions remain runtime configuration concerns; source discovery never grants execution authority.
