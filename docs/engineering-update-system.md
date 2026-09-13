# Engineering Update System

## Purpose

The repository already contains useful building blocks for agent skills, orchestration, architecture analysis, capability-gap detection, change-impact analysis, evidence tracking, API readiness, and self-improvement. The missing capability is an integrated engineering loop that can take a repository change request or discovered gap and produce a verified, reviewable update.

## Current capabilities observed

- Agent Skills are stored under `.agents/skills` and follow the open SKILL.md model.
- `api-production-readiness` defines a strong readiness checklist, including runtime evidence requirements.
- `architecture-xray` provides architecture-oriented analysis.
- `capability-gap-builder` targets capability gaps.
- `change-impact-graph` targets impact analysis.
- `evidence-ledger` targets evidence capture.
- `failure-injection-planner` targets failure-oriented testing.
- `autonomous-build-loop` and orchestrator skills target execution flow.
- `scripts/self-improve.mjs` performs inventory-based gap detection and can generate candidate skills.
- `eval/cases.json` defines evaluation cases for solution creation, self-improvement, security regression, and GitHub verification.
- `scripts/validate-skills.mjs` provides structural/security validation.

## Critical gaps

### 1. Repository state model
There is no single machine-readable snapshot describing repository structure, runtime, dependencies, entry points, tests, CI, interfaces, and ownership boundaries. Without this, downstream agents must rediscover the same context.

### 2. Gap-to-change planning contract
Capability-gap detection is not yet connected to a deterministic change plan containing scope, acceptance criteria, affected files, risk, required tests, and rollback strategy.

### 3. Execution evidence pipeline
Evidence is represented as a skill concept, but there is no unified execution record that binds a proposed change to commands, outputs, test results, CI results, and artifact hashes.

### 4. Change verification gate
The existing validator validates skills. It does not act as a repository-wide release gate for arbitrary application updates. We need a gate that evaluates build, tests, security, compatibility, regression, and evidence before an update can be declared ready.

### 5. Before/after regression model
There is no general contract for comparing the repository baseline against the proposed change across tests, public interfaces, configuration, dependencies, and behavioral checks.

### 6. Update packaging
The system needs a standard update manifest that explains what changed, why, affected surface, verification performed, residual risks, and reviewer actions. This is what makes an automated change comfortable to review and submit.

### 7. Safe autonomy boundaries
The current pieces describe autonomous behavior, but the complete system needs explicit decision boundaries: what may be analyzed automatically, what may be modified, what requires human approval, and what evidence is mandatory before promotion.

### 8. Real evaluator execution
`self-improve.mjs` currently detects gaps primarily by matching expected terms against skill names/descriptions. This is useful inventory logic, but it is not behavioral evaluation of whether a capability actually works.

### 9. External-project compatibility
The current repository is optimized around its own skill inventory. The target system must operate against an arbitrary repository without assuming the repository uses this project's structure.

## Target architecture

```text
Repository
   |
   v
Repository Intelligence
   |
   +--> Baseline Snapshot
   +--> Architecture / Dependencies / Interfaces
   |
   v
Gap & Risk Engine
   |
   v
Change Planner
   |
   v
Implementation Loop
   |
   +--> Test Generation
   +--> Failure Injection
   +--> Security Checks
   +--> Impact Analysis
   |
   v
Verification Engine
   |
   +--> Build
   +--> Unit / Integration / E2E
   +--> Regression
   +--> Compatibility
   +--> CI / External Evidence
   |
   v
Evidence Ledger
   |
   v
Update Manifest + Patch / PR
   |
   v
Release Gate
```

## First implementation milestone

Build the core contracts before adding more skills:

1. `repository-snapshot` — normalized repository inventory.
2. `change-plan` — machine-readable proposed update and acceptance criteria.
3. `execution-record` — commands, results, timestamps, environment assumptions, and evidence references.
4. `verification-result` — deterministic pass/fail/warn result with blocking findings.
5. `update-manifest` — reviewable before/after summary and residual-risk record.
6. A single `engineering-update` runner that composes these contracts without bypassing existing skills.

## Definition of success

A supported repository should be able to enter the system with a requested improvement or discovered gap and leave with either:

- a verified update package suitable for review/PR, or
- a reproducible failure report explaining exactly why the update is not safe to promote.

The system must never report an update as complete merely because code was generated. Completion requires executable evidence.