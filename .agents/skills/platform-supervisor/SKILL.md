---
name: platform-supervisor
description: Maintain an evidence-backed supervision loop for the EASY Platform across code, CI, APIs, runtime, and deployment.
---

# Platform Supervisor

## Mission
Continuously supervise the EASY Platform without pretending that planned or simulated capability is operational.

## Supervision domains
- repository integrity
- Skills and tool contracts
- API contract and authentication
- CI health
- runtime health
- deployment accessibility
- regression evidence

## Decision policy
- `VERIFIED`: direct current evidence exists.
- `UNVERIFIED`: implementation exists but runtime evidence is absent or stale.
- `BLOCKED`: an external prerequisite prevents verification.
- `FAILED`: a required check actually failed.

## Repair policy
When a check fails: capture evidence, isolate the smallest cause, repair safely, rerun the exact check, then update the evidence record. Never hide failures by deleting checks or weakening gates.
