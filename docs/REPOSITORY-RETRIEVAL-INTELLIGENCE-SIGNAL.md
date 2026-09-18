# Repository Retrieval Intelligence Signal

## Why this matters

Recent coding-agent evaluation work isolates repository context acquisition as a distinct failure mode. Agent Retrieval Bench evaluates file-level retrieval across code2test, comment2context, trace2code, edit2ripple, no-gold, and counterfactual wrong-repository cases. CodeScaleBench evaluates large-codebase software-engineering tasks with and without MCP context tools.

The engineering lesson for Elite is to measure the retrieval stage separately instead of assuming that a correct-looking patch proves that context selection was correct.

## Adopted pattern

task -> scope -> retrieve -> justify context -> detect missing or irrelevant context -> plan -> edit -> verify

## Integration targets

- Elite: retrieval gate before autonomous edits.
- ARMY-14: context evidence becomes part of soldier handoff contracts.
- Repository Intelligence: expose architecture, dependency, and history context with provenance.
- MCP: measure tool-assisted retrieval against baseline rather than assuming MCP is beneficial.
- SNIPER: treat unexpected repository or tool-context changes as signals, not automatic compromise conclusions.

## Acceptance evidence

A future Elite retrieval run should emit a machine-readable record containing task scope, selected files, retrieval rationale, misses or abstentions, token/context budget, tool calls, and final task verification. Retrieval success must not be converted into task success.

## References

- Agent Retrieval Bench: https://arxiv.org/abs/2607.24882
- CodeScaleBench: https://github.com/sourcegraph/CodeScaleBench/blob/public/docs/technical_reports/TECHNICAL_REPORT.md
- MCP-AgentBench: https://doi.org/10.1609/aaai.v40i37.40347
