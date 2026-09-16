---
name: repo-archaeologist
description: Rapidly map an unfamiliar repository, identify rules, architecture, entry points, tests, workflows, and likely change locations before implementation.
---

# Repo Archaeologist

Use this skill at the start of unfamiliar repository work.

## Procedure
1. Identify repository, default branch, and working scope.
2. Read applicable repository instructions and operating rules before proposing changes.
3. Map top-level directories, package manifests, source entry points, tests, CI workflows, and configuration.
4. Search for the requested capability and its nearest tests before editing.
5. Separate verified facts from assumptions.
6. Produce a compact change map: files to inspect, files likely to change, validation commands/workflows, and blockers.

## Guardrails
- Never modify files during archaeology unless the user explicitly requested implementation as part of the same task.
- Never expose secrets.
- Never bypass authentication, MFA, CAPTCHA, quotas, rate limits, or security controls.
- Prefer the smallest implementation surface.
