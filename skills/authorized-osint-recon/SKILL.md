---
name: authorized-osint-recon
description: Perform authorized, passive OSINT and defensive reconnaissance using public metadata such as domain/DNS/RDAP, IP/ASN context, public username presence, phone-number numbering metadata, and controlled service discovery. Use only on assets or identities the operator is authorized to investigate; never bypass authentication, privacy controls, rate limits, or access restrictions.
---

# Authorized OSINT Recon

## Purpose
Provide a reusable, evidence-first workflow for public-information reconnaissance. This skill distills reusable patterns from ARGCYBERSKILLHUB's OSINT-X, OCTOPUS, Web-Info, Phone-X, and GUI-ARGRecon projects without importing their application code.

## Inputs
- Explicitly authorized target or research subject.
- Scope and purpose.
- Optional domain, IP/hostname, username, or phone number.
- Required output format.

## Workflow
1. Confirm scope is authorized and define the target exactly.
2. Prefer passive/public sources first:
   - DNS and RDAP/domain metadata.
   - Public IP/ASN/ISP and approximate geolocation metadata.
   - Public username/profile presence.
   - Phone numbering-plan metadata, country/region, formatting, timezone, and carrier metadata where publicly available.
3. Normalize inputs before querying.
4. Record source provenance and retrieval time for each material finding.
5. Separate facts from heuristics. Treat carrier hints, geolocation, and username matches as non-proof unless independently corroborated.
6. For active service discovery, require explicit authorization and keep scans bounded, rate-limited, and non-disruptive.
7. Produce a concise evidence-backed result and preserve uncertainty.
8. Never claim access, identity, ownership, or vulnerability merely from a public signal.

## Safety boundaries
- No credential theft, authentication bypass, private-data access, stealth/persistence, malware, botnets, DDoS, spoofing, amplification, or evasion.
- Do not scan third-party infrastructure without explicit authorization.
- Do not turn public metadata into doxxing or sensitive personal profiling.
- Do not bypass CAPTCHA, MFA, quotas, rate limits, robots/access controls, or provider protections.
- If scope or authorization is missing for an active technique, stop that technique and continue with passive analysis when appropriate.

## Evidence contract
Every substantive finding should carry:
- target;
- source;
- retrieval timestamp;
- observation;
- confidence;
- limitations.

A successful lookup is not proof of identity, ownership, authorization, or compromise.

## Source signal
Distilled from:
- https://github.com/argcyberskillhub/OSINT-X
- https://github.com/argcyberskillhub/OCTOPUS
- https://github.com/argcyberskillhub/Web-Info
- https://github.com/argcyberskillhub/Phone-X
- https://github.com/argcyberskillhub/GUI-ARGRecon

Do not copy upstream application code into this skill. Reuse the workflow concepts only, subject to license/provenance review.
