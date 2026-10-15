---
name: local-provider-verification
description: Verifies a local LLM provider as a real execution path using a reproducible health check, completion test, evidence capture, and failure classification.
---
# Local Provider Verification

## Procedure
1. Identify the local runtime, model, revision, endpoint, and host boundary.
2. Verify runtime readiness without treating health alone as completion evidence.
3. Execute the smallest real completion fixture.
4. Capture request, model identity, response status, latency, and output evidence without secrets.
5. Distinguish unavailable runtime, missing model, timeout, malformed output, and successful completion.
6. Repeat the fixture when required for deterministic verification.
7. Record the provider as verified only when the real completion succeeds.

## Integration
Use this Skill for local Ollama or equivalent OpenAI-compatible providers as a development, fallback, and provider-independent test lane.

## Completion rule
A local endpoint returning HTTP success is not enough. A real model completion and task-specific acceptance evidence are required.
