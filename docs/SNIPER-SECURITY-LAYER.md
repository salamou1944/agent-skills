# SNIPER Security Layer

## Purpose

SNIPER is a defensive first-deviation detector for MONY/EASY. It watches the engineering and runtime baseline and identifies the earliest unexplained signal that materially changes risk.

SNIPER does not perform counter-intrusion or destructive actions against third parties.

## Detection model

Baseline -> observe change -> correlate signals -> score confidence -> contain/revoke -> preserve evidence -> recover -> verify.

Signals include:
- new or changed source IP / ASN / device identity
- authentication and session anomalies
- new credentials, tokens, keys, or webhook destinations
- privilege and authorization changes
- code, dependency, configuration, schema, or deployment changes
- new processes/services or unusual API/tool use
- unexpected external network destinations
- audit/log integrity changes

A single new IP is an anomaly, not proof of compromise. SNIPER correlates independent signals and considers expected change windows, approved actors, deployment metadata, and known automation.

## First-deviation record

Each material deviation should capture:
- timestamp
- asset/service
- signal type
- observed value and baseline value (redacted where sensitive)
- actor/source identity
- provenance
- related change/deployment ID
- confidence
- risk
- response taken
- verification result

## Response policy

SNIPER may defensively:
1. alert
2. require re-authentication or step-up verification
3. revoke/rotate affected credentials
4. isolate the affected internal workload
5. freeze sensitive automation
6. preserve evidence
7. restore a known-good state
8. require independent verification before resuming

SNIPER must not:
- access an attacker's systems
- delete third-party data
- retaliate
- exfiltrate attacker data
- treat an anomaly as proof without corroboration

## Engineering invariant

Every high-impact change must have attributable provenance. Unattributed changes become verification blockers until explicitly reviewed.

## Verification

A response is incomplete until an independent verifier confirms:
- the original deviation is no longer active
- affected credentials are invalidated
- persistence paths are closed
- expected services still function
- audit evidence is intact
- no new unexplained deviation was introduced by remediation

## Scope

This is a design contract for the existing agent-skills/control-plane ecosystem. Implementation should be incremental and test-driven rather than introducing a second security control plane.
