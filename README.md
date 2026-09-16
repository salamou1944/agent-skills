# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

[![skills.sh](https://skills.sh/b/vercel-labs/agent-skills)](https://skills.sh/vercel-labs/agent-skills)

## AI Automation & API Engineering Services

**From manual process to working automation.**

Paid implementation, pilot, repair, and integration support for businesses:

- n8n workflow automation
- AI agents and business-process automation
- WhatsApp lead qualification, follow-up, and human handoff
- CRM integrations and synchronization
- REST API and webhook integrations
- Document and data automation
- Workflow debugging, reliability hardening, and monitoring
- Rapid MVP and production implementation

**Contact:** easy@agentmail.to

**Full service details:** [SERVICES.md](SERVICES.md)

## GitHub + Copilot Engineering Layer

This repository now includes a version-controlled Copilot operating layer for reliable GitHub work:

- `.github/copilot-instructions.md` — repository-wide rules and engineering contract
- `.github/instructions/` — security and skill-specific path rules
- `.github/agents/` — GitHub Operator, Repository Guardian, and Verification Supervisor
- `.github/prompts/` — repeatable GitHub audit and verified-change workflows
- `.agents/skills/github-capability-audit/` — capability/access audit skill
- `docs/GITHUB-COPILOT-EXCELLENCE.md` — current capability map, architecture, security boundaries, and official references

Start with the GitHub capability audit when access, Copilot readiness, or automation capability is unclear.

## Available Skills

### elite-code-engineer

High-rigor coding workflow for turning requirements into production-quality software. It combines repository archaeology, architecture selection, implementation discipline, failure-path testing, adversarial review, repair loops, integration verification, and evidence-backed completion.

**Use when:**

- Building a feature or application from a requirement
- Repairing non-trivial bugs
- Refactoring code without breaking existing behavior
- Working on security-sensitive or integration-heavy code
- Requiring real validation instead of plausible generated code

**Core loop:**

`requirements -> inspect -> design -> implement -> test -> adversarial review -> repair -> verify -> evidence`

### code-progress-supervisor

Continuous engineering supervisor that tracks implementation progress, detects regressions and CI failures, drives evidence-based root-cause repair through the coding agent, and repeats validation until acceptance criteria are verified or a real external blocker remains.

**Use when:**

- A coding agent must continue working without manual monitoring
- Builds/tests/CI can fail during implementation
- Regressions need to be caught and repaired immediately
- Completion must be evidence-backed rather than assumed

**Core loop:**

`inspect state -> measure progress -> detect failure -> diagnose -> repair -> validate -> record evidence -> continue`

### vercel-optimize

Audits a Vercel project for cost, performance, reliability, caching, function usage, and billing opportunities. It collects Vercel metrics first, then investigates only the routes and files those metrics point to.

### react-best-practices

React and Next.js performance optimization guidelines from Vercel Engineering.

### web-design-guidelines

Review UI code for compliance with web interface best practices.

### writing-guidelines

Review docs and prose for compliance with the Vercel writing handbook.

### react-native-guidelines

React Native best practices optimized for AI agents.

### react-view-transitions

Implement smooth, native-feeling animations using React's View Transition API.

### composition-patterns

React composition patterns that scale, including compound components and state lifting.

### vercel-deploy-claimable

Deploy applications and websites to Vercel with claimable preview deployments.

## Installation

```bash
npx skills add vercel-labs/agent-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
Build this feature and verify it end-to-end
```

```
Keep implementing this project, monitor every validation failure, repair regressions, and continue until the acceptance criteria are verified
```

```
Review this React component for performance issues
```

## Discovery index

Every change to a skill on `main` publishes an immutable GitHub release with an Agent Skills discovery index and one artifact per skill. Build the same artifacts locally with:

```bash
npm ci --ignore-scripts
node scripts/build-discovery-index.mjs https://example.com/skills
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)

## License

MIT
