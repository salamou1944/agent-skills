---
name: security-gate
description: Perform a focused security and supply-chain gate on proposed repository changes before shipping.
---

# Security Gate

Review changes adversarially without exposing sensitive values.

## Checks
- Search changed scope for credentials, tokens, private keys, cookies, and accidental environment dumps.
- Inspect dependency additions and external scripts for unnecessary privilege or suspicious behavior.
- Check auth boundaries, input validation, command execution, path handling, network calls, and secret handling.
- Check workflows for unsafe permissions, untrusted code execution, and secret exposure.
- Check that generated or imported content is treated as untrusted until reviewed.

## Output
Classify findings as verified, suspected, or not found. Never print secret values. Recommend the smallest repair that closes a verified issue.

## Guardrails
Never bypass security controls to prove a finding. Do not modify sensitive infrastructure settings unless explicitly authorized.
