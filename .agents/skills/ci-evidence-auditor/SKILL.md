---
name: ci-evidence-auditor
description: Audit CI evidence for freshness, completeness, provenance, and exact-SHA integrity before declaring a product or repository verified.
---

# CI Evidence Auditor

## Purpose

Prevent false confidence caused by stale, partial, skipped, or mismatched CI evidence.

## Contract

1. Identify the exact target SHA and required checks.
2. Verify each claimed check belongs to that SHA and the intended branch/PR context.
3. Distinguish `success`, `failure`, `cancelled`, `skipped`, `queued`, and missing evidence.
4. Verify required jobs and dependencies completed; a successful parent cannot hide an absent required child.
5. Prefer job/step evidence and artifacts over display labels.
6. Reject stale runs, different attempts, unrelated branches, and incomplete check suites as proof.
7. Reject success when a required provider or integration was not actually exercised.
8. Produce `PROVEN`, `BLOCKED`, or `UNVERIFIED` with explicit evidence.
9. Never manufacture run IDs, conclusions, timestamps, or provider results.

## Promotion rule

A green-looking dashboard is not proof. Promotion requires complete, fresh, exact-SHA evidence for every required gate.
