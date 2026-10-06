---
name: defensive-security-transformation
description: Safely transform a reviewed security-research capability into a bounded defensive or authorized-red-team Skill by extracting detection, evidence, remediation, and regression logic while removing or isolating weaponized behavior.
---

# Defensive Security Transformation

## Purpose

Turn useful security-research capabilities into reusable defensive Skills without promoting unrestricted offensive execution.

## Inputs

- source capability and provenance
- authorized target/lab scope
- intended defensive objective
- available source code or technical description
- required evidence standard

## Workflow

1. Verify provenance, license, and intended scope.
2. Classify the source capability as safe, restricted, or dangerous.
3. Extract the useful mechanism: detection logic, protocol/parser knowledge, indicators, evidence model, remediation pattern, or regression oracle.
4. Do not copy weaponized procedures verbatim.
5. Remove or isolate credential theft, authentication/access-control bypass, persistence, evasion, destructive behavior, exfiltration, malware deployment, stealth, and unrestricted target interaction.
6. Add an explicit authorization/scope gate.
7. Bound execution with allowlists where applicable, rate/impact limits, timeouts, and safe failure.
8. Produce evidence containing target, scope, timestamp, observation, confidence, and limitations.
9. Add a remediation pattern.
10. Add a regression/retest procedure when technically possible.
11. Record provenance, license, transformation decisions, and residual risks.
12. Promote only after validation against the canonical Skill admission rules.

## Authorized Red-Team Mode

Use only against assets or isolated labs explicitly in scope. The objective is vulnerability discovery and verification of remediation, not persistence, stealth, theft, disruption, or access to unrelated systems.

## Safety Boundaries

Never bypass authentication, MFA, CAPTCHA, quotas, rate limits, provider protections, or access controls. Never deploy malware, steal credentials/tokens, exfiltrate data, destroy data, establish persistence, or conceal unauthorized activity.

## Evidence Contract

Every finding should identify:

- target and authorized scope
- source/test used
- retrieval/test timestamp
- observed behavior
- security impact
- confidence
- limitations
- remediation
- retest result

## Promotion rule

A dangerous capability becomes a canonical Skill only after its reusable defensive logic has been independently expressed with bounded execution and evidence-first verification. If safe transformation is not possible, keep the capability in quarantine as knowledge-only.

## Definition of Done

- defensive objective is explicit
- authorization boundary is explicit
- dangerous behavior is removed or isolated
- evidence is reproducible
- remediation is documented
- regression/retest exists or limitation is recorded
- provenance/license is recorded
- no embedded secrets
- canonical Skill validation passes
