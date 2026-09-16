# GitHub + Copilot Excellence Map

Checked: 2026-09-16

## What GitHub currently provides for repository-aware Copilot

GitHub documents several complementary customization layers:

- `.github/copilot-instructions.md` — repository-wide instructions.
- `.github/instructions/*.instructions.md` — path-specific instructions using `applyTo`.
- `.github/agents/*.agent.md` — repository custom agents with their own instructions and optional tool/model configuration.
- `.github/prompts/*.prompt.md` — reusable prompt templates.
- Agent skills — reusable instruction/script/resource packages loaded when relevant.
- GitHub MCP — a supported way to expose GitHub context and operations to Copilot; availability of individual tools still follows the underlying GitHub feature/permission requirements.
- GitHub Copilot CLI — command-line Copilot with custom agents and repository instructions.
- GitHub CLI — command-line access to repositories, issues, PRs, Actions, secrets/variables, and other GitHub operations where the authenticated account is permitted.

## Our repository architecture

`agent-skills` is the home for generic, reusable agent capabilities. Product-specific code stays in its owning repository. Operational memory/evidence stays in `AI_operating_memory`.

This repository now contains a Copilot configuration layer:

- `.github/copilot-instructions.md`
- `.github/instructions/security.instructions.md`
- `.github/instructions/skills.instructions.md`
- `.github/agents/github-operator.agent.md`
- `.github/agents/repo-guardian.agent.md`
- `.github/agents/verification-supervisor.agent.md`
- `.github/prompts/github-audit.prompt.md`
- `.github/prompts/ship-verified-change.prompt.md`
- `.agents/skills/github-capability-audit/SKILL.md`

## Operating model

Use the repository-wide instructions for rules that must always apply. Use path-specific instructions for narrow concerns. Use custom agents for specialist roles. Use prompts for repeatable task recipes. Use skills for reusable procedures and helper assets.

For GitHub work, the preferred sequence is:

`inspect access -> inspect rules -> inspect repository state -> select supported capability -> make smallest safe change -> validate -> read back -> record evidence`

## Access reality

Repository write access must be demonstrated by an actual successful write, not inferred from a UI label. A Copilot feature documented by GitHub is not proof that this account has the feature; plan, permission, feature rollout, repository settings, and tool exposure can differ.

Do not bypass authentication, MFA, CAPTCHA, quotas, rate limits, branch protections, or security controls to increase automation.

## Security reality

Public repositories can be copied. The control objective is therefore secret prevention, least privilege, safe automation, and protection of sensitive operational material—not preventing someone from copying public source code.

Never commit live credentials. If a credential is suspected to have been committed, treat it as compromised, rotate/revoke it, and then clean the repository history using an approved process.

## Official references

- Repository Copilot customization: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-copilot-overview
- Custom instructions: https://docs.github.com/en/copilot/concepts/prompting/response-customization
- Custom agents: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents
- Custom agent configuration: https://docs.github.com/en/copilot/reference/custom-agents-configuration
- Copilot CLI custom agents: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli
- Copilot MCP: https://docs.github.com/en/copilot/concepts/context/mcp
- GitHub MCP in IDE: https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server
- GitHub CLI: https://cli.github.com/manual/gh
- GitHub CLI Copilot: https://cli.github.com/manual/gh_copilot
- GitHub's community customization library: https://github.com/github/awesome-copilot

## Important limitations

- Prompt files are documented as public preview and may change.
- MCP tool availability follows the access requirements of the underlying GitHub feature.
- Some Copilot cloud-agent capabilities require a paid Copilot license.
- The current connected GitHub tool may expose repository content/write operations without exposing every GitHub administration or account-security endpoint.

## Research sources used for this map

Primary GitHub documentation and GitHub-maintained resources were checked on 2026-09-16. The `github/awesome-copilot` repository was also reviewed for current examples and conventions for agent profiles, instruction files, and skills.
