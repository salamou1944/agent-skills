# AGENTS.md

This repository is the engineering core for the Elite autonomous coding system, ARMY-14 soldier contracts, Revenue Engine/MONY automation, and reusable agent skills. It is no longer limited to a Vercel skill collection.

## Operating contract

- Inspect repository rules, current state, and relevant code before changing anything.
- Execute the requested capability before claiming completion.
- Evidence must distinguish **task completion** from **pipeline/repository verification**.
- Never report a practical gate, health check, provider reachability check, or successful workflow as proof that the requested business/code task was completed.
- Never expose or commit secrets, credentials, tokens, private keys, or sensitive environment values.
- Do not bypass authentication, quotas, rate limits, CAPTCHA/MFA, or service protections.
- Preserve repository boundaries and avoid copying `.elite-code-tools` into a target repository's persisted changes.
- Prefer minimal, reversible changes and fail closed when verification is ambiguous.

## ChatGPT / Codex execution layer

ChatGPT, Codex, repository agents, Skills, connected Apps/Plugins, MCP tools, and GitHub integration are treated as one coordinated execution toolchain, subject to their actual permissions.

Before implementing or repairing non-trivial work:

1. Inspect the live repository state and applicable rules.
2. Search `Project-/COLLECTION` for reusable resources, platforms, libraries, prompts, skills, agents, and prior evidence.
3. Search the connected GitHub repositories for repository-native solutions.
4. Choose the strongest authorized execution surface: Codex for coding/testing/review, Work for long multi-step research/deliverables when available, Skills for reusable procedures, and connected Apps/MCP/GitHub tools for live actions.
5. Verify that the capability is actually available before relying on it.
6. Execute the smallest action that increases verified completion.

Do not generate a human instruction merely because an authorized agent/tool can perform the underlying action. Do not claim an agent executed anything unless execution evidence exists.

### Mode selection

- **Chat:** coordination, reasoning, search, and concise decisions.
- **Work:** long multi-step research and deliverables when available.
- **Codex:** repository editing, tests, debugging, refactoring, review, and shipping.
- **Skills:** reusable domain procedures and progressive-disclosure instructions.
- **Apps / Plugins / MCP:** live external systems and authorized actions.
- **GitHub integration:** live repository inspection and mutation when permissions allow.

## Collection-to-execution bridge

`Project-/COLLECTION` is an execution source, not a read-only archive.

For each non-trivial build, repair, or integration:
- search COLLECTION first;
- inspect the relevant capture/index/verification evidence;
- reuse proven resources when compatible;
- validate the resource in the current environment;
- register newly discovered high-value resources in the canonical collection structure;
- avoid duplicate records.

A collection record is evidence about a resource, not proof that the resource works in the current runtime.

## Elite result semantics

Elite automation must use explicit result states:

- `VERIFIED` / `TASK_VERIFIED`: the requested task was implemented and its task-specific acceptance checks passed.
- `VERIFIED_NOOP` / `NOOP_VERIFIED`: the task was already satisfied and evidence proves that state.
- `PIPELINE_VERIFIED`: repository/agent infrastructure passed its practical checks, but the requested task was not proven complete.
- `FAILED`: execution or verification failed.

`PIPELINE_VERIFIED` must never be treated as `TASK_VERIFIED` by a supervisor, workflow, or persistence step.

## Repository architecture

- `skills/` contains reusable agent skills.
- `apps/easy-developer-platform/` contains Elite runtime, autonomous coding, ARMY-14 practical verification, and related orchestration.
- `apps/revenue-engine/` contains MONY/Revenue Engine orchestration and provider adapters.
- `.github/agents/` contains the canonical 14 soldier profiles.
- `.github/workflows/` contains CI and orchestration workflows. Workflow changes require explicit review and must preserve fail-closed verification.

## Cost and revenue rule

Prefer $0, existing-plan, or open-source paths when they meet the requirement. Do not introduce paid providers, API credits, subscriptions, or infrastructure spend without an explicit need and approval. If a provider is blocked by quota/credits, keep the system honest and fail closed; never simulate successful provider execution.

## Creating a new skill

### Directory Structure

```
skills/
  {skill-name}/
    SKILL.md
    scripts/
    references/
    lib/
```

### Naming conventions

- Skill directories use `kebab-case`.
- `SKILL.md` is uppercase and exact.
- Scripts use `kebab-case.sh` or `kebab-case.mjs`.

### Skill format

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill.}
---

# {Skill Title}

{Brief description.}

## How It Works

{Numbered workflow}

## Usage

{Usage}

## Output

{Machine-readable and user-facing output}
```

## Script requirements

- Bash scripts: `#!/bin/bash` and `set -e`/`set -euo pipefail` where appropriate.
- Node scripts: `#!/usr/bin/env node` and `.mjs`.
- Human-readable status belongs on stderr; machine-readable JSON belongs on stdout.
- Temporary files require cleanup traps where practical.
- Scripts must fail closed when required evidence is missing.

## Context efficiency

Skills are loaded on demand. Keep `SKILL.md` concise, use progressive disclosure, and move detailed references into dedicated files.

## Verification before response

Before claiming a change is complete:

1. Re-read the applicable repository rules.
2. Inspect the changed files and resulting diff.
3. Run syntax/tests or the strongest repository-native checks available.
4. Confirm task-specific acceptance evidence.
5. Report remaining limitations instead of converting infrastructure success into a completion claim.
