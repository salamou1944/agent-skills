# Independent Patch Verification

This skill adds a semantic verification gate to autonomous coding.

## Why

Autonomous coding systems can produce a patch that compiles and passes existing tests while addressing a different interpretation of the issue. Recent research proposes independent, bidirectional reconstruction and reconciliation as a way to expose that failure mode. In our system, this is implemented as an engineering pattern rather than a claim that one technique guarantees correctness.

## Flow

`requirements → candidate patch → forward reconstruction → blind backward reconstruction → reconciliation → targeted verification → decision`

The backward reconstruction must be performed without the original issue text or forward rationale. The purpose is to test whether the patch itself communicates the intended repair through its changed behavior.

## Decision semantics

- **PASS** — independent reconstructions align and task-specific checks pass.
- **REPAIR** — partially aligned or a deterministic check exposes a repairable defect.
- **BLOCKED** — required evidence is unavailable or unsafe to obtain.
- **FAIL** — the patch is materially misaligned or violates a hard acceptance condition.

## Elite placement

This gate belongs between normal verification and final completion. It strengthens the existing evidence contract:

`requirements → inspect → design → implement → test → adversarial review → repair → verify → evidence`

It must never weaken the existing fail-closed rules.
