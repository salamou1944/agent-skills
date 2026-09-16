---
name: github-capability-audit
description: Audit GitHub access and Copilot readiness, map available capabilities to verified permissions, and close safe configuration gaps with evidence.
---

# GitHub Capability Audit

## Purpose
Determine what GitHub and Copilot capabilities are actually reachable for the current repository and identify the smallest safe changes that improve agent effectiveness.

## Procedure
1. Inspect repository metadata, default branch, permissions available to the connected tool, and current tree.
2. Read applicable repository instructions and security rules before changing files.
3. Inspect `.github/copilot-instructions.md`, `.github/instructions/`, `.github/agents/`, `.github/prompts/`, agent skills, workflows, and relevant documentation.
4. Separate capabilities into: verified available, available only with user-side setup/plan/permission, unsupported by the current connector, and unknown.
5. For Copilot, check repository instructions, path-specific instructions, custom agents, prompt files, skills, MCP, and CLI integration patterns.
6. Prefer official GitHub documentation for current product behavior; record source URLs and date checked.
7. Make only safe repository-local improvements that are within granted write access.
8. Read every changed file back from GitHub and record commit evidence.

## Safety boundaries
- Never bypass authentication, MFA, CAPTCHA, quotas, rate limits, branch protections, or platform security.
- Never create or store live credentials in the repository.
- Never infer Copilot Pro/paid feature eligibility from documentation; verify the account's actual UI or entitlement separately.
- Do not change repository visibility, billing, permissions, or account settings unless an exact supported action is explicitly authorized.

## Completion evidence
Report the repository, commit SHA, changed paths, validation performed, and unresolved access blockers. A documented capability is not a verified capability until the current environment demonstrates access to it.
