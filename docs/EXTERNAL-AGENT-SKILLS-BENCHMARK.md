# External Agent-Skills Benchmark — September 2026

## Purpose

Benchmark public agent-skill engineering patterns against this repository without copying proprietary implementation.

A current public agent-skills release documents useful patterns: phase-oriented engineering, in-repo skill evaluation with structural/routing/behavioral tiers, explicit rejection of incomplete grader results, throwaway-workspace cleanup, idempotency keys derived from intent, retrieval safety, and dependency/install hardening. These patterns are useful because they make agent capability claims measurable rather than prompt-dependent.

## Adapted into this repository

### 1. Layered evaluation

Added skills/evidence-driven-agent-evaluation/SKILL.md.

The local adaptation separates:
- structural validation,
- routing validation,
- deterministic behavioral tests,
- artifact/diff inspection,
- regression verification.

### 2. Provider-independent verification

Deterministic orchestration and repository transformations should remain testable when an external LLM/provider returns 429 or is unavailable. Provider-dependent tests remain explicitly provider-dependent.

This does not bypass quotas or provider protections. It prevents an unrelated provider outage from being mistaken for a defect in deterministic control-plane logic.

### 3. Evidence taxonomy

Use:
- PASS when acceptance evidence exists,
- BLOCKED when an external dependency prevents verification,
- FAIL when the implementation executes and violates the contract.

A blocked check must never be promoted by changing the assertion or hiding the failure.

### 4. Integration targets

- Elite: distinguish deterministic control-plane closure from provider-dependent coding tasks.
- ARMY-14: route evaluation work to the appropriate verification/review owner.
- MONY: keep provider-confirmed revenue evidence separate from infrastructure/provider reachability.
- EASY: keep deterministic product-integrity and workflow validation independent from optional generative providers.
- SNIPER: preserve the first unexplained deviation and its evidence rather than collapsing it into a generic failure.

## Benchmark rule

External projects are references for methods and failure modes. Implement only patterns that fit this repository's contracts, security boundaries, and measured acceptance criteria.