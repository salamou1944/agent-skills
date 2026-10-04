# ChatGPT Operator Bridge

This repository may create a handoff when its autonomous providers cannot safely complete a task.

## Contract

A handoff MUST contain:
- repository and exact revision
- task goal
- provider failures
- files inspected
- tests/verification attempted
- requested next action
- explicit statement that no completion is claimed

The handoff is a queue, not fake execution.

## Invocation boundary

A repository cannot directly summon a specific ChatGPT conversation/session. It can, however:
1. persist a machine-readable handoff in GitHub;
2. open/update a `[CHATGPT-HANDOFF]` issue;
3. expose the exact task and evidence for the next connected ChatGPT operator;
4. resume automatically when a real provider becomes available.

Never put secrets, tokens, credentials, or private key material in the handoff.

## Priority

1. real production blockers
2. CI/runtime failures
3. customer/revenue paths
4. reliability
5. cleanup/polish

No mock success. No bypassing quotas, authentication, rate limits, CAPTCHA, or MFA.
