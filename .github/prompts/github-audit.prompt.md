---
description: Audit a GitHub repository for access, Copilot readiness, security, automation, and verification gaps.
agent: github-operator
---

Audit the target repository end-to-end.

1. Inspect repository metadata, default branch, structure, instructions, skills, agents, workflows, tests, and recent changes.
2. Identify which GitHub capabilities are actually available and which require plan, permission, or user action.
3. Check Copilot configuration: repository instructions, path-specific instructions, agent profiles, prompt files, skills, MCP configuration, and relevant hooks/workflows.
4. Check security boundaries and secret-handling controls without exposing secret values.
5. Compare findings against the repository's own rules and acceptance criteria.
6. Make only safe, reversible improvements that are clearly within scope.
7. Read changed files back and report exact evidence: files, commit, checks, and remaining blockers.

Do not infer access from UI labels or historical messages. Verify the current state.
