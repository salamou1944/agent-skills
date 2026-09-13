# Engineering System Map

This map prevents duplicate work. It separates capabilities that already exist from the integration/runtime layers still required.

## 1. Existing capability inventory

| System responsibility | Existing capability | Status |
|---|---|---|
| Adaptive orchestration | `adaptive-orchestrator` | Existing |
| First orchestrator patterns | `create-first-orchestrator` | Existing |
| Autonomous build loop | `autonomous-build-loop` | Existing |
| Architecture discovery | `architecture-xray` | Existing |
| Capability gap discovery | `capability-gap-builder`, `skill-gap-detector` | Existing |
| Change impact | `change-impact-graph` | Existing |
| Solution creation | `solution-creator`, `solution-composer`, `solution-evolver` | Existing |
| Multiple solution paths | `multi-path-solver` | Existing |
| Blocked-path recovery | `constraint-breaker`, `impossible-path-builder` | Existing |
| Assumption checking | `assumption-challenger` | Existing |
| Evidence | `evidence-ledger` | Existing |
| Failure planning | `failure-injection-planner` | Existing |
| Regression | `regression-synthesizer` | Existing |
| Real API verification | `real-api-testing` | Existing |
| Security | `security-audit`, `security-boundary-mapper`, `prompt-firewall` | Existing |
| Dependency risk | `dependency-risk-oracle` | Existing |
| Rollback | `rollback-planner` | Existing |
| GitHub delivery | `github-delivery`, `github-native-maintainer` | Existing |
| Self evaluation | `self-evaluator`, `self-evaluating-orchestrator` | Existing |
| Skill generation/evolution | `skill-factory`, `skill-evolution-engine`, `skill-benchmark`, `failure-to-skill` | Existing |
| Repository memory | `repo-memory` | Existing |
| Release verification | `release-verification`, `release-observer` | Existing |

## 2. Missing integration/runtime layer

The repository has many of the right ideas as Skills. The missing part is their deterministic composition and executable state.

### A. Engineering Orchestrator

A runtime state machine that selects capabilities, orders them, enforces gates, retries safely, and records why each decision was made.

### B. Change Request Contract

A normalized input contract for user requests and discovered gaps. It must produce objective, scope, acceptance criteria, constraints, risk, and required evidence.

### C. Capability/Skill Resolver

Maps a task requirement to available Skills/APIs, detects missing capability, and can invoke the capability-building path when required.

### D. Update Executor

Actually applies an approved implementation plan. It must operate only inside an isolated workspace during preview and must log every mutation.

### E. Sandbox / Preview Runtime

Creates a disposable worktree/copy, applies the candidate update there, and guarantees the original repository is not modified.

### F. Verification Runtime

Executes the relevant build/test/security/regression checks using explicit command policies and captures stdout/stderr, exit status, duration and environment metadata.

### G. Regression Comparator

Compares baseline and candidate behavior, interfaces, dependency/configuration surfaces and test outcomes.

### H. Evidence Binder

Binds every verification claim to an execution record, artifact/hash, test result or CI result. Unsupported claims must not reach `READY_FOR_REVIEW`.

### I. Promotion Gate

Produces a deterministic verdict such as `READY_FOR_REVIEW`, `READY_WITH_WARNINGS`, or `NOT_READY`. Promotion to a branch/PR is downstream of this gate.

### J. Delivery Adapter

Packages the verified change as a branch/commit/PR without confusing delivery with verification.

## 3. Correct composition

```text
Change Request
      |
      v
Engineering Orchestrator
      |
      +--> Repository Intelligence
      +--> Capability Resolver
      +--> Solution Portfolio
      +--> Change Planner
      |
      v
Update Executor
      |
      v
Isolated Sandbox / Preview
      |
      +--> Build
      +--> Tests
      +--> Failure Injection
      +--> Security
      +--> Regression
      |
      v
Evidence Binder
      |
      v
Promotion Gate
      |
      +---- NOT_READY / WARNINGS
      |
      +---- READY_FOR_REVIEW --> Delivery Adapter --> PR
```

## 4. Implementation priority

### Phase 1 — Foundation

1. Change Request contract.
2. Orchestrator state machine.
3. Capability resolver.
4. Sandbox/preview runtime.
5. Command execution policy and execution ledger.

### Phase 2 — Proof

6. Verification runtime.
7. Regression comparator.
8. Evidence binder.
9. Promotion gate.

### Phase 3 — Delivery

10. Delivery adapter / PR package.
11. Rollback package.
12. Reviewer-facing update report.

### Phase 4 — Evolution

13. Behavioral self-evaluation.
14. Failure-to-skill loop.
15. Skill evolution and benchmark loop.
16. Repository/task memory.
17. Production observation and feedback.

## 5. Rule for future ideas

A new idea must first be classified as one of:

- existing capability,
- missing core runtime,
- integration contract,
- verification/evidence requirement,
- delivery/operations capability,
- future research idea.

It must then be recorded in `docs/idea-registry.md` before implementation priority is changed. This keeps exploration open without allowing the active build to become chaotic.
