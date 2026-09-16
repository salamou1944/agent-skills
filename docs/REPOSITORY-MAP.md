# Canonical Repository Map

This is the canonical navigation map for Elite, Supervisor, and human work across Salamou's repositories. Do not move project code between repositories just to improve organization. Organize by documented role and use this file as the first navigation point.

## 1. Priority and role

| Priority | Repository | Role | Primary work |
|---|---|---|---|
| P0 | `salamou1944/Easy-` | EASY product | Seller/product journey, Creative Engine, commerce, E2E, sellable capability |
| P0 | `salamou1944/agent-skills` | Engineering + Revenue Engine (`mony`) | Elite/Supervisor, skills/APIs/tools, Revenue Engine, client hunting, monetization |
| P1 | `salamou1944/Salamou-31` | Sellable AI/API services | AI Product Content API, API hardening, tests, documentation, production readiness |
| P1 | `salamou1944/AI_operating_memory` | Operating memory/reference | Persistent project knowledge and cross-project memory; inspect before adding duplicate state |

## 2. Canonical ownership

### `salamou1944/Easy-`
- Product repository for EASY.
- Read `PROJECT-RULES.md` before work.
- Current automation: `.github/workflows/elite-code-supervisor.yml`.
- Main runtime/application code lives under `apps/easy-developer-platform/`.
- Commerce work is provider-neutral; Shopify is an adapter, not the seller-facing contract.
- Do not assume a feature exists because a UI or plan exists; verify the implementation and tests.

### `salamou1944/agent-skills`
- Central engineering automation repository.
- Elite worker: `apps/easy-developer-platform/autonomous-coder.mjs`.
- Elite contract: `skills/elite-code-engineer/SKILL.md`.
- Progress supervisor: `skills/code-progress-supervisor/SKILL.md`.
- Reusable supervisor: `.github/workflows/elite-code-reusable-supervisor.yml`.
- Cross-project task queue: `docs/ELITE-TASK-QUEUE.md`.
- Revenue Engine (`mony`) state and monetization work belongs here unless a concrete product implementation belongs in another repository.
- Do not put EASY product code here merely for convenience.

### `salamou1944/Salamou-31`
- Sellable API/service repository.
- Primary service: `services/ai-product-content-api/`.
- Its Elite workflow uses the central reusable supervisor from `agent-skills`.
- Keep credentials and provider secrets outside source control.

### `salamou1944/AI_operating_memory`
- Reference/memory repository.
- Use it to recover durable cross-project context when needed.
- Do not duplicate implementation code here.
- If the repository has no conventional README or index, inspect its actual tree before assuming structure.

## 3. Search order for Elite

1. Read this map.
2. Identify the target repository from the current workflow context.
3. Read that repository's rules (`PROJECT-RULES.md`, `CORE-RULES.md`, `AGENTS.md`, `SECURITY.md`, or equivalent if present).
4. Inspect current branch, recent commits, tests, and relevant directories.
5. Search the target repository for the capability/blocker.
6. Consult `docs/ELITE-TASK-QUEUE.md` only after the current workflow goal is understood.
7. Implement the smallest safe step.
8. Run repository-native verification and `git diff --check`.
9. Re-inspect the resulting state before marking the task verified.

## 4. Cross-project dependency map

`agent-skills / Elite + Supervisor`
→ orchestrates work in `Easy-` and `Salamou-31`

`Salamou-31 / AI Product Content API`
→ provides reusable AI product-content capability

`Easy- / EASY`
→ product/platform target that may consume reusable AI/API capabilities through provider-neutral boundaries

`agent-skills / mony`
→ packages reusable capabilities into sellable services, client workflows, and revenue experiments

`AI_operating_memory`
→ reference layer for durable project context; never use it as a substitute for inspecting the live repository state

## 5. Naming convention for future additions

- Product code stays in its product repository.
- Shared engineering automation stays in `agent-skills`.
- Sellable standalone API/service code stays in `Salamou-31` unless a later verified architecture decision changes ownership.
- Durable cross-project notes belong in the memory repository or the canonical docs here, not scattered across random files.
- Every new major repository must be added to this map before Elite is instructed to work on it.
