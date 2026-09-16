# GitHub + Copilot Top-Signal Research

Checked: 2026-09-16

## Scope

A second pass was made specifically against high-signal/high-visibility GitHub Copilot resources, with emphasis on GitHub-maintained material and resources surfaced as popular in GitHub Marketplace. "Top-rated" is treated as high-signal/popular rather than a fabricated numeric ranking; GitHub does not expose one universal rating for Copilot customization resources.

## Highest-signal sources reviewed

### 1. github/awesome-copilot
GitHub's community collection for Copilot agents, instructions, prompts, skills, hooks, extensions, and learning material.

Useful areas reviewed:
- `agents/`
- `instructions/`
- `skills/`
- skill specification/usage documentation
- `github-copilot-starter` skill
- repository `AGENTS.md` contribution/format rules

Key lessons incorporated:
- agents should have a required `description`; `name`, `tools`, and `model` are recommended where appropriate
- instruction files should define `description` and `applyTo`
- skills should have matching lowercase-hyphen `name` and folder name plus a meaningful `description`
- skills can bundle scripts, templates, references, and other assets
- detect the repository before changing it; validate after changes
- keep instructions focused and avoid unnecessary context

### 2. GitHub Copilot Agent Skills documentation
GitHub documents Agent Skills as reusable folders of instructions, scripts, and resources that Copilot can load when relevant. Skills are supported across Copilot cloud agent, code review, CLI, Copilot app, and agent mode in VS Code/JetBrains, subject to the relevant product/plan policies.

Important architecture point: skills are for repeatable task-specific capabilities; agents provide broader specialized behavior; MCP provides live external service/data connectivity.

### 3. GitHub Marketplace — Copilot-related apps
The Marketplace currently surfaces popular Copilot-related integrations such as the Microsoft Copilot app, Copilot for Jira, Copilot for Linear, GitGuardian, CI/build integrations, and agent-supervision products. These are external integrations and should not be treated as automatically available to this account.

### 4. Community curated agent collection
`Code-and-Sorts/awesome-copilot-agents` is a useful secondary curated index covering instructions, prompts, skills, MCPs, and custom agents. It is treated as a discovery source, not as authoritative product documentation.

## High-value capabilities to add to our system

1. **Repository archaeology/onboarding** — map structure, stack, conventions, integrations, tests, and concerns before implementation.
2. **AI-readiness assessment** — inspect the repository's AI configuration and close concrete gaps.
3. **Agent governance** — enforce tool permissions, trust boundaries, audit trails, rate limits, and safety controls.
4. **Agentic evaluation** — evaluate outputs, regression-test agent behavior, and use evaluator/optimizer loops.
5. **Agent supply-chain integrity** — hash/pin agent assets and detect unexpected modifications.
6. **Multi-agent orchestration** — separate planning, implementation, review, and verification responsibilities while preserving evidence.
7. **Security/OWASP agentic review** — audit agentic attack surfaces before production use.
8. **Copilot setup workflow** — when GitHub Actions is intentionally used, provide a minimal `copilot-setup-steps.yml` with least-privilege contents read permission.

## What we should NOT copy blindly

- Third-party credentials or provider-specific secrets.
- Community agents whose tools exceed our actual permissions.
- Marketplace integrations without checking account/repository authorization.
- Large prompt collections that duplicate existing instructions and consume context without adding capability.
- Any technique that bypasses authentication, MFA, CAPTCHA, quotas, rate limits, branch protections, or platform security.

## Existing implementation in this repository

The findings are reflected in:
- `.github/copilot-instructions.md`
- `.github/instructions/security.instructions.md`
- `.github/instructions/skills.instructions.md`
- `.github/agents/github-operator.agent.md`
- `.github/agents/repo-guardian.agent.md`
- `.github/agents/verification-supervisor.agent.md`
- `.github/prompts/github-audit.prompt.md`
- `.github/prompts/ship-verified-change.prompt.md`
- `.agents/skills/github-capability-audit/SKILL.md`

## Source links

- https://github.com/github/awesome-copilot
- https://github.com/github/awesome-copilot/blob/main/AGENTS.md
- https://github.com/github/awesome-copilot/blob/main/docs/README.skills.md
- https://github.com/github/awesome-copilot/blob/main/skills/github-copilot-starter/SKILL.md
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- https://github.com/Code-and-Sorts/awesome-copilot-agents
- https://github.com/marketplace?copilot_app=true&type=apps

## Verification note

The authoritative GitHub resources were read directly on 2026-09-16. Community resources were used for discovery and pattern comparison only. No universal "highest rated" numerical ranking was invented because GitHub does not expose one consistent rating metric across these resource types.
