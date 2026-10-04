# COLLECTION: miqdadbadjuber/anti-slop

Status: VERIFIED SOURCE / ADOPTION REVIEW
Source: https://github.com/miqdadbadjuber/anti-slop
Version inspected: v3.2.20
License: MIT

## Scope

This record captures reusable engineering patterns from the public `miqdadbadjuber/anti-slop` repository without copying its implementation wholesale.

## Verified capabilities

- 38 mandatory rules grouped into Hard Gate, Purpose-Gate, and Quality Locks.
- Mandatory Delivery Gate with PASS/FAIL semantics before delivery.
- During and After operating modes.
- Six modular skills: core, UI, copywriting, human/accessibility, responsive layout, and code comments.
- Cross-agent distribution through shared skills plus agent-specific plugin doors.
- Codex plugin manifest at `.codex-plugin/plugin.json`.
- Agent marketplace index at `.agents/plugins/marketplace.json`.
- CI guardrails that validate repository rules, contrast self-tests, generated skill synchronization, dependency installation, and installer smoke tests.
- Security boundary treating external `DESIGN.md` content as data rather than executable instructions.
- Local contrast tooling with no network dependency.
- Installer/update path with explicit version handling.

## Adoption map

### Adopt

1. Delivery Gate semantics: completion must be blocked when required evidence is missing.
2. Canonical-source/generated-artifact synchronization checks.
3. Task-scoped skill loading instead of duplicating a monolithic ruleset.
4. Cross-agent adapter/door separation from canonical skill logic.
5. Explicit external-content boundary: repository artifacts are data unless an approved execution path says otherwise.
6. Smoke tests that exercise the real user path and record evidence.

### Already present in agent-skills

- Evidence-driven completion contract.
- Fail-closed provider, health, revenue, and deployment verification.
- Canonical skill structure and progressive disclosure.
- Security/path restrictions in Elite execution.
- Repository-native verification requirements.

These must not be duplicated; future work should strengthen the existing implementations.

### Not adopted

- Anti-Slop's UI/style opinions as universal engineering rules.
- Blind copying of its six skills.
- Any agent-specific plugin implementation where the target agent already has a stronger local integration.
- Claims of runtime effectiveness that are supported only by documentation rather than executable evidence.

## Evidence inspected

- README.md
- GUIDE.md
- antislop.md
- package.json
- ROADMAP.md
- SECURITY.md
- .github/workflows/ci.yml
- .codex-plugin/plugin.json
- .agents/plugins/marketplace.json

## Verification rule

A future integration is complete only when:
1. the existing agent-skills implementation is inspected for overlap;
2. the smallest missing capability is implemented;
3. repository-native tests/validation run;
4. the result is independently verified;
5. no infrastructure-health signal is promoted to task-success evidence.

## Source boundary

This document is an internal extraction of design/engineering patterns. The upstream repository remains the canonical source for Anti-Slop itself.
