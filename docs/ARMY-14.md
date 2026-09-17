# Army 14 — Software Factory Soldiers

The commander is outside this roster. These fourteen are execution soldiers. Each soldier has a primary mission and a composed skill arsenal. Existing repository skills are reused rather than duplicated.

| # | Soldier | Primary responsibility | Core skills |
|---|---|---|---|
| 01 | Architect | requirements, architecture, contracts, system design | architecture-xray, assumption-challenger, autonomous-build-loop, cross-agent-handoff, agentic-eval |
| 02 | Builder | full-stack implementation | elite-code-engineer, autonomous-build-loop, autonomous-capability-builder, capability-gap-builder, code-review |
| 03 | UI/UX | responsive product interface and interaction | web-design-guidelines, react-best-practices, react-view-transitions, composition-patterns, browser-presence-operator |
| 04 | Backend/API | server logic, APIs, webhooks, reliability | api-production-readiness, autonomous-build-loop, bug-triage, change-impact-graph, code-review |
| 05 | Database | schemas, migrations, persistence, authorization boundaries | architecture-xray, api-production-readiness, change-impact-graph, bug-triage, code-review |
| 06 | Security | application and supply-chain security | security-sentinel, code-review, bug-triage, change-impact-graph, assumption-challenger |
| 07 | Integrations | external APIs, providers, OAuth, webhooks | api-production-readiness, cross-agent-handoff, autonomous-build-loop, browser-presence-operator, code-review |
| 08 | AI Agent | tool-using agents, retrieval, memory, orchestration | adaptive-orchestrator, agentic-eval, cross-agent-handoff, autonomous-capability-builder, assumption-challenger |
| 09 | Test/QA | executable correctness and regression coverage | agentic-eval, bug-triage, code-review, autonomous-build-loop, capability-gap-builder |
| 10 | Browser/E2E | real-user browser verification | browser-presence-operator, web-design-guidelines, react-best-practices, agentic-eval |
| 11 | Debug/Repair | root-cause diagnosis and repair loops | bug-triage, change-impact-graph, autonomous-build-loop, code-review, assumption-challenger |
| 12 | Deployment/Ops | build, deploy, health, rollback, smoke verification | vercel-deploy-claimable, api-production-readiness, browser-presence-operator, autonomous-build-loop, bug-triage |
| 13 | Product/MVP | smallest complete usable vertical slice | customer-discovery, autonomous-capability-builder, autonomous-build-loop, assumption-challenger, agentic-eval |
| 14 | Research/Capability | discover missing capabilities, docs, reusable components | architecture-xray, capability-gap-builder, customer-discovery, assumption-challenger, chatgpt-task-bridge |

## Factory doctrine

A soldier must inspect the real target state before acting. A plan is not an implementation. A commit is not verification. When something fails, the soldier must find the cause, repair it, test it, and verify the resulting state. Existing capabilities must be reused when they already solve the problem. Secrets and private credentials never enter source, logs, or artifacts.

The fourteen soldiers are designed to compose: Research → Architect → Product/MVP → Builder → UI/Backend/Database/Integrations/AI → Security → Test/QA → Browser/E2E → Debug/Repair → Deployment/Ops. The commander decides sequencing and parallelism.

## Definition of ready

A new application request is ready for handoff only when the relevant soldiers have produced executable artifacts and evidence: source, tests, configuration boundaries, and—when deployment is requested—a verified running deployment. Blockers must remain explicit rather than being disguised as success.

## Verification

The roster is enforced by `.github/workflows/army-14-validation.yml`, which checks the exact 14 profiles, required operating sections, registry entries, and basic secret-like patterns.
