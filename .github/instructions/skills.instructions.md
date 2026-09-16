---
description: Conventions for reusable agent skills in this repository
applyTo: ".agents/skills/**/*,skills/**/*"
---

- Keep skills generic and reusable; do not embed product-specific business logic unless the skill is explicitly product-neutral.
- Each skill must state its purpose, activation conditions, operating procedure, safety boundaries, and verification expectations.
- Prefer deterministic helper scripts for repetitive checks when practical.
- Record assumptions and external dependencies explicitly.
- Do not claim a skill works until its referenced files and executable paths have been checked.
- Reuse existing skills when they already cover the capability; extend rather than duplicate when safe.
