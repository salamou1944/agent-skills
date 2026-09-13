# Tool Factory Contract

When an observed deficit cannot be satisfied by an accepted upstream tool, create a new internal tool through this contract.

## Required inputs

- capability statement
- threat model
- input/output schema
- permission scope
- timeout and resource limits
- fallback behavior
- validation rules
- provenance/licensing requirements

## Required outputs

1. `tool.json` — machine-readable identity, schema, permissions and version.
2. Adapter implementation — provider-neutral boundary.
3. Unit tests — happy path, invalid input, timeout, dependency failure.
4. Security tests — secret leakage, path/command scope, authorization boundaries.
5. Integration smoke test — real execution against a controlled fixture.
6. Evidence record — exact commit, test commands/results, dependencies and known limitations.
7. Deficit closure entry — links the new tool to the capability gap that caused it.

## Fail-closed rule

A generated tool is not promoted merely because its code exists. It remains `candidate` until the executable tests and security gate pass. Unknown provider behavior is treated as a failure, not success.

## Learning loop

`observed failure -> deficit -> search trusted sources -> compare candidates -> adapt existing tool OR generate new tool -> test -> promote -> monitor -> feed failures back into deficits`
