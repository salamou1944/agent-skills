# VibeFree Capability Signal — September 2026

VibeFree currently presents a free, ad-funded AI chat and VS Code coding agent. Its developer documentation says the extension can read/create/edit project files, search the codebase, run shell commands and background tasks, connect to MCP servers, maintain task lists, schedule jobs, fetch URLs/media, and request explicit decisions instead of guessing. It states that users do not need their own OpenAI or Anthropic API key.

Business model: the service says short ads fund AI usage rather than a subscription. Its advertising documentation describes loader ads and in-response cards and says advertisers bid for blocks of 1,000 verified views.

## What we extract

1. Agent runtime capabilities should be evaluated as a coherent execution loop, not as isolated chat features.
2. Workspace permissions, visible diffs, checkpoint/rewind, task tracking, MCP, terminal execution, and scheduling are valuable control-plane primitives.
3. An ad-funded financing model is a potential cost-control signal for MONY/Elite experimentation, but it is not evidence that the service has unlimited capacity or is appropriate for proprietary code.
4. Advertising must remain outside agent decision logic. Sponsored content must never influence technical output, tool selection, security decisions, or evaluation results.

## Integration decision

Implemented a reusable `ad-funded-agent-runtime` evaluation skill in agent-skills. VibeFree remains an external benchmark/reference, not a dependency of the production control plane.

## Verification boundary

Before any real repository is connected to an external free coding agent, verify privacy, data retention, model/provider routing, workspace permissions, quotas, terms, and rollback behavior. Do not put secrets or sensitive credentials into an unverified third-party runtime.