# Repository Structure

This repository is the engineering core for reusable agent skills, Elite autonomous coding, ARMY-14 verification, and MONY/Revenue Engine automation.

## Top-level layout

```text
.
├── .agents/                 # Agent skill catalog and agent-local skill metadata
├── .easy/                   # EASY-specific local/control metadata
├── .github/                 # CI, agents, prompts, instructions, and workflow automation
├── apps/                    # Executable application/runtime surfaces
│   ├── easy-developer-platform/
│   └── revenue-engine/
├── config/                  # Shared configuration and policy data
├── docs/                    # Architecture, operational state, and engineering documentation
├── eval/                    # Evaluation fixtures and verification assets
├── packages/                # Reusable libraries/modules
├── registry/                # Skill/capability registries and discovery metadata
├── scripts/                 # Repository maintenance, validation, and build tooling
├── skills/                  # Canonical reusable agent skills
├── tools/                   # Supporting developer/operator tools
├── AGENTS.md                # Repository-wide agent operating contract
├── README.md                # Public repository entry point
├── SECURITY.md              # Security policy
├── SERVICES.md              # External service offering documentation
├── package.json             # Node project scripts/dependencies
├── railway.toml             # Railway deployment configuration
└── Dockerfile.easy-runtime  # EASY runtime container definition
```

## Placement rules

- Keep repository-wide policy files at the root: `AGENTS.md`, `README.md`, `SECURITY.md` and `SERVICES.md`.
- Keep executable product/runtime code under `apps/` and shared code under `packages/`.
- Keep reusable agent instructions under `skills/`; do not duplicate canonical skills in application code.
- Keep CI and GitHub agent definitions under `.github/`.
- Keep operational state/checkpoints and architecture documentation under `docs/`.
- Keep generated, evaluation, registry, and maintenance concerns in their dedicated directories.
- Do not move paths merely for visual cleanliness when workflows, imports, deployment configuration, or external integrations depend on the existing path. Structural changes must preserve contracts.
- Never commit secrets, credentials, provider tokens, private keys, or live affiliate URLs.

## Source-of-truth boundaries

- `skills/` is the canonical reusable skill layer.
- `.github/agents/` is the canonical ARMY-14 soldier profile layer.
- `apps/easy-developer-platform/` is the Elite/runtime execution layer.
- `apps/revenue-engine/` is the MONY execution layer.
- `AI_operating_memory` is the canonical machine-readable cross-repository project-state store; local checkpoint files are snapshots only.

## Change discipline

1. Inspect consumers before moving or renaming a path.
2. Prefer small, reversible structural changes.
3. Update documentation and references in the same change set.
4. Run repository-native validation after structural changes.
5. Treat a green CI pipeline as infrastructure evidence, not proof that a business task was completed.
