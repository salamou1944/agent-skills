# Held-out evaluation boundary

The Evolution frontier has a coordinator-owned acceptance layer separate from candidate generation.

## Required evidence

A mutation cannot promote itself. Acceptance requires an exact baseline revision, unique candidate ID, candidate diff SHA-256, deterministic test success, adversarial-check success, and independent fresh-clone replay success.

The evaluator records its own SHA-256 identity in the result.

## Trust boundary

Provider output and candidate code are untrusted. The evaluator is coordinator-owned and does not accept a candidate-supplied verification command set.

A HELDOUT_VERIFIED result is repository evidence only. It is not production or revenue evidence.

## Fail-closed behavior

Missing evidence, baseline drift, malformed hashes, or any failed acceptance signal produce REJECTED.
