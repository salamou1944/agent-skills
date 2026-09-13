# CI Manual Dispatch

Repository-side skill for reliable human-triggered GitHub Actions verification.

It deliberately separates three states:

1. **Configured** — the workflow declares `workflow_dispatch`.
2. **Dispatched** — an actual GitHub Actions dispatch operation was accepted.
3. **Verified** — a new workflow run is observable and its final conclusion is known.

The skill never treats configuration as execution and never fabricates CI results when the connected GitHub capability cannot dispatch workflows.
