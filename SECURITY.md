# Security Policy

## Security boundary
This public repository must never contain live API keys, access tokens, OAuth client secrets, passwords, cookies, private certificates, customer credentials, or other private operational secrets.

Secrets belong in protected environment variables or a dedicated secret manager, never in source files, issues, pull requests, logs, or documentation.

## Reporting a suspected leak
Do not copy or repost a suspected credential. Report the file/path and commit reference privately to `easy@agentmail.to` so it can be contained and rotated.

## Public disclosure boundary
Public content is limited to safe skills, documentation, and portfolio/service material. Private implementation details, infrastructure credentials, customer data, and internal operating memory must remain outside public-facing material.

## Remediation rule
Any real credential committed to Git history is treated as compromised and must be revoked/rotated before cleanup.
