# Autonomous Coding Agent Architecture — Capability Extraction

This document translates current coding-agent architecture signals into provider-neutral Elite/ARMY-14 requirements.

## Verified external patterns

- Claude-family agentic systems emphasize long-horizon state tracking, incremental progress, context awareness, and continuation across context windows. Anthropic's current agentic guidance explicitly discusses saving state before context refreshes and continuing from durable task state. citeturn1search5
- Devin Desktop combines local/cloud agents, a command-center surface, codebase context, review, MCP integrations, language servers, and background-agent workflows. Cognition describes Devin Desktop as the new name for Windsurf. citeturn1search0turn1search1
- Devin CLI exposes per-tool/path permission rules, hooks, background shells, AGENTS.md, MCP, skills, ACP, and handoff to Devin Cloud; its Fusion design explicitly separates a lead model from a cheaper sidekick for exploration/file reads/tests. citeturn1search3
- OpenCode supports multiple providers, custom OpenAI-compatible endpoints, primary agents and subagents, per-agent permissions, ACP, and configurable model selection. citeturn0search0turn0search3turn0search4
- OpenCode's current V2 LSP documentation is an important correction to simplistic claims: its V2 configuration exists, but built-in LSP runtime/diagnostics are not currently active; projects should rely on compiler/lint/typecheck/test commands for reliable feedback until that runtime lands. citeturn0search1

## Architecture to build

`INTAKE → RETRIEVE → PLAN → EXECUTE → OBSERVE → VERIFY → REPAIR/CHECKPOINT → CONTINUE → COMPLETE`

### Required control-plane capabilities

1. Retrieval intelligence with measurable recall/precision.
2. Durable task graph and dependency-aware scheduling.
3. Explicit subagent contracts and scoped permissions.
4. Model/provider routing with health/quota-aware fallback.
5. Context compaction with durable state reconstruction.
6. Checkpoint, diff, and rollback semantics.
7. Failure taxonomy and bounded recovery.
8. Tool/event audit trail.
9. Layered verification and task-specific evidence.
10. Human approval only where policy requires it, without making approval the sole verification mechanism.

## Corrections to the supplied research

- Do not describe current Claude model names as static; Anthropic's model catalog changes rapidly and current documentation lists newer model generations. Treat model identity as a time-stamped observation. citeturn1search10
- Do not assert that Cursor is based on a particular model/provider without a current first-party source. Model routing is a configuration/product detail that can change.
- Do not equate a successful build, a model response, or a high AI-code percentage with task correctness. For example, Cognition's PCW metric measures attributed committed code, not verified software correctness. citeturn1search7
- Do not claim OpenCode V2 has active LSP diagnostics merely because its configuration accepts LSP settings. Current docs explicitly say the V2 runtime does not yet provide that behavior. citeturn0search1
- Do not infer failure-recovery capabilities merely because a product supports retries or background execution. Elite must test each failure class directly.

## Elite/ARMY-14 acceptance gates

A coding-agent capability is VERIFIED only if the repository contains direct evidence for:
- correct retrieval;
- plan/decomposition;
- bounded tool execution;
- permission enforcement;
- provider fallback where applicable;
- durable checkpoint/resume;
- repair from observed failures;
- rollback integrity;
- artifact/diff inspection;
- regression tests;
- task-specific acceptance.

Infrastructure health is not task proof.
