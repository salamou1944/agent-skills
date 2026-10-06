---
name: soat-runtime-verification
description: Verify a pinned SOAT runtime through API Factory with authenticated provider resolution, real AI completion, official smoke tests, execution-contract evidence, and business-outcome evidence consumption. Use when validating SOAT integration without mistaking CI proof for commercial revenue.
license: MIT
---

# SOAT Runtime Verification

Use this Skill to verify the SOAT + API Factory integration from source to real local-model completion.

## Procedure

1. **Pin provenance**
   - Record the exact SOAT commit/ref and the API Factory commit under test.
   - Never use a moving SOAT revision for a verification claim.
2. **Run deterministic API Factory tests first**
   - Install dependencies without audit/funding changes.
   - Run the repository's deterministic test suite.
   - Stop on syntax/test failures; do not start SOAT merely to mask a local defect.
3. **Verify request mapping**
   - Confirm SOAT system/instruction messages are mapped separately from request messages.
   - Verify the generated SOAT request contains the intended message boundary.
4. **Start isolated SOAT**
   - Start the pinned SOAT runtime with its required database and local Ollama services.
   - Expose only the CI host port needed for health/probe checks.
   - Record the exact health response.
5. **Bootstrap authenticated local provider**
   - Create a temporary CI admin credential.
   - Authenticate through SOAT.
   - Create a project and local Ollama provider.
   - Mask tokens; never persist credentials in source or evidence artifacts.
6. **Verify API Factory provider probe**
   - Use the provider-neutral SOAT adapter.
   - Require transport success and authorization success.
   - Prefer the non-mutating /api/v1/projects connectivity probe.
7. **Verify real AI completion**
   - Execute an actual completion through API Factory → SOAT → local Ollama.
   - Require a non-empty real response.
   - Distinguish real completion from model discovery, HTTP reachability, mocks, or fixture-only responses.
8. **Run the official SOAT smoke suite**
   - Execute the upstream smoke path with a bounded timeout/evidence runner.
   - Preserve exit code, timeout status, duration, and command provenance.
9. **Validate execution evidence**
   - Require all gates: health, authentication, provider resolution, API Factory probe, real chat completion, and official smoke suite.
   - Fail closed when any gate or provenance field is missing.
10. **Consume evidence in the business-outcome gate**
   - Verified SOAT evidence may establish the technical prerequisite and ENTRY_POINT_VERIFIED.
   - It must not be promoted automatically to USAGE_OBSERVED, CUSTOMER_ACTION_OBSERVED, or REVENUE_OBSERVED.
   - Those require real external/customer evidence.
11. **Persist the evidence**
   - Record run ID, commit, pinned SOAT SHA, provider/project identifiers where safe, gate results, artifact digest, and evidence boundary.
   - Link the durable record to AI_operating_memory.
   - Keep application secrets out of operating memory.
12. **Clean up**
   - Always remove SOAT containers, volumes, and temporary resources.
   - Diagnostic/cleanup steps must tolerate an earlier setup failure and must not introduce a secondary failure.

## Evidence boundary

A successful CI-local SOAT run proves the verified SOAT + API Factory runtime integration path with the configured local provider. It does not prove production deployment, customer usage, revenue, or commercial provider billing.

For external providers, a missing key/credit/billing state is BLOCKED, never a successful provider proof.

## Promotion

- INTEGRATION_VERIFIED: all runtime gates pass.
- ENTRY_POINT_VERIFIED: a usable entry point is independently verified.
- USAGE_OBSERVED: real non-CI use is observed.
- CUSTOMER_ACTION_OBSERVED: an independently verifiable customer action occurs.
- REVENUE_OBSERVED: real qualifying revenue is observed.

Never collapse these states.
