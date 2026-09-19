# Evolution Orchestrator

This runtime executes **competition**, not just validation.

It starts from one immutable Git baseline, applies at least two materially different candidate mutations in isolated sandboxes, runs deterministic tests against each, attacks each candidate, rejects protected-boundary violations, and emits a hash-bound evidence record.

Pipeline:

`Baseline → Candidate A/B/... → Isolated Sandbox → Test → Attack → Compare → Single Survivor → Evidence`

The orchestrator is deliberately fail-closed: zero survivors or multiple survivors cannot be promoted. It never edits GitHub workflows, secrets, credentials, authentication policy, or deployment configuration through candidate changes.

It does not claim autonomous research or revenue. Those are higher layers that must supply the candidate mutations and production evidence separately.

Run:

`node apps/easy-developer-platform/evolution-orchestrator.mjs manifest.json`
