# Agent Skills / Elite Engineering Core

This repository is the engineering core for reusable AI-agent skills, **Elite autonomous coding**, **ARMY-14 verification**, and **MONY / Revenue Engine** automation.

It started as a skills collection and has evolved into a broader, evidence-driven agent engineering platform.

## What lives here

| Layer | Location | Purpose |
|---|---|---|
| Reusable skills | `skills/` | Canonical agent skills and progressive-disclosure instructions |
| Agent-local catalog | `.agents/` | Agent skill metadata and capability discovery |
| Elite runtime | `apps/easy-developer-platform/` | Autonomous coding, supervision, repair, and verification |
| MONY / Revenue Engine | `apps/revenue-engine/` | Revenue discovery, routing, provider adapters, evidence and measurement |
| ARMY-14 | `.github/agents/` | Canonical 14-soldier profiles and ownership contracts |
| GitHub automation | `.github/` | CI, agents, prompts, instructions, and orchestration workflows |
| Shared libraries | `packages/` | Reusable implementation modules |
| Verification | `eval/` | Evaluation and verification assets |
| Registry | `registry/` | Capability/skill registry and discovery data |
| Tooling | `scripts/`, `tools/` | Maintenance, validation, and operator utilities |
| Documentation | `docs/` | Architecture and operational checkpoints |

See [`docs/REPOSITORY-STRUCTURE.md`](docs/REPOSITORY-STRUCTURE.md) for the canonical layout and source-of-truth boundaries.

## Engineering contract

The repository is designed around evidence-backed completion:

`requirements → inspect → design → implement → test → adversarial review → repair → verify → evidence`

Elite distinguishes task completion from infrastructure health. In particular, `PIPELINE_VERIFIED` must never be promoted to `TASK_VERIFIED` without task-specific acceptance evidence.

The same fail-closed principle applies to provider reachability, health checks, revenue evidence, and deployment verification.

## GitHub + Copilot engineering layer

- `.github/copilot-instructions.md` — repository-wide Copilot rules
- `.github/instructions/` — security and path-specific rules
- `.github/agents/` — operator, guardian, verification, and ARMY-14 agent definitions
- `.github/prompts/` — repeatable audit and verified-change workflows
- `.agents/skills/github-capability-audit/` — GitHub capability/access audit skill
- `docs/GITHUB-COPILOT-EXCELLENCE.md` — capability map and engineering guidance

## MONY / Revenue Engine

MONY uses the architecture:

`discover → verify → score → route → package → publish → measure → learn`

Only provider-confirmed commission events count as revenue. A configured or reachable affiliate URL is not proof of a click, signup, conversion, commission, or payout.

The canonical machine-readable MONY state lives in the separate `AI_operating_memory` repository. The local checkpoint in `docs/PROJECT-STATE-MONY.md` is an engineering snapshot, not a competing state store.

## AI Automation & API Engineering Services

**From manual process to working automation.**

The repository supports implementation, repair, and integration work for:

- n8n workflow automation
- AI agents and business-process automation
- WhatsApp lead qualification and human handoff
- CRM integrations and synchronization
- REST API and webhook integrations
- Document and data automation
- Reliability hardening and monitoring
- Rapid MVP and production implementation

**Contact:** easy@agentmail.to

**Service details:** [`SERVICES.md`](SERVICES.md)

## Skill development standard

Each reusable skill follows a predictable structure:

```text
skills/
└── <skill-name>/
    ├── SKILL.md
    ├── scripts/       # optional
    ├── references/    # optional
    └── lib/           # optional
```

Conventions:

- Skill directories use `kebab-case`.
- The entry file is exactly `SKILL.md`.
- Load detailed references progressively instead of bloating `SKILL.md`.
- Scripts fail closed when required evidence is missing.
- Human-readable status belongs on stderr; machine-readable JSON belongs on stdout.

## Discovery index

Changes to skills on `main` publish an immutable GitHub release with an Agent Skills discovery index and one artifact per skill. Build locally with:

```bash
npm ci --ignore-scripts
node scripts/build-discovery-index.mjs https://example.com/skills
```

## Installation

```bash
npx skills add vercel-labs/agent-skills
```

## Verification before completion

Before claiming a change is complete:

1. Re-read the applicable repository rules.
2. Inspect changed files and the resulting diff.
3. Run syntax/tests or the strongest repository-native checks available.
4. Confirm task-specific acceptance evidence.
5. Record unresolved limitations instead of converting infrastructure success into a completion claim.

## Security

Never commit secrets, credentials, tokens, private keys, or live affiliate URLs. Do not bypass authentication, quotas, rate limits, CAPTCHA/MFA, or provider protections.

See [`SECURITY.md`](SECURITY.md) for the security policy.

## License

MIT
