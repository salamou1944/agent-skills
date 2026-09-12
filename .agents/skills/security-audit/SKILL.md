---
name: security-audit
description: Audit application, API, agent, and skill changes for security weaknesses before release. Use for security review, threat modeling, secrets exposure, authz/authn, injection, unsafe tool use, dependency risk, and data exposure. Do not use as a substitute for a specialist penetration test.
---
# Security Audit

1. Establish scope and assets.
2. Inspect changed code, configuration, dependencies, scripts, and skill instructions.
3. Threat-model trust boundaries and attacker-controlled inputs.
4. Check authentication, authorization, input validation, output encoding, secrets, logging, rate limits, SSRF, injection, deserialization, file access, and data exposure.
5. For agent/skill code, inspect tool permissions, prompt injection surfaces, hidden instructions, exfiltration paths, and unsafe shell/network actions.
6. Produce findings with severity, evidence, impact, exploit preconditions, and remediation.
7. Never claim a clean bill of health without stating scope and tests actually performed.
