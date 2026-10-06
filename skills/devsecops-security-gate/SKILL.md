---
name: devsecops-security-gate
description: Builds a fail-closed software security gate from secret detection, dependency/vulnerability scanning, SBOM, policy checks, and signed-artifact evidence.
---
# DevSecOps Security Gate

## Procedure
1. Define repository, artifact, dependency, and container scope.
2. Run secret detection before publishing or deploying artifacts.
3. Run dependency and vulnerability checks with explicit severity and policy thresholds.
4. Generate or consume a verifiable SBOM when dependency inventory is required.
5. Apply license and policy checks separately from vulnerability findings.
6. Produce machine-readable findings with tool identity, version, revision, scope, and timestamp.
7. Fail closed on confirmed policy violations; distinguish scanner error from clean results.
8. Preserve evidence sufficient to reproduce the gate decision.

## Tool boundary
Collection references Gitleaks/Betterleaks, Trivy, Semgrep, OSV-Scanner, Grype, Syft, Cosign, and CodeQL as source candidates. This Skill does not claim those tools have been executed unless current CI evidence proves it.

## Security
Never upload secrets or private source to an external scanner without an explicitly verified data path and authorization.
