# LUNA-FRONTIER-002 — Meta-Evolution of the Evaluator

The laboratory now treats the evaluator as an experimental object.

## Hypothesis

A frontier can be an artifact of the scoring function rather than a property of the candidate. Therefore a candidate should be stress-tested against mutations of the evaluator itself.

## Experiment

- Enumerate all 128 genomes from the seven optional traits.
- Run metamorphic checks to ensure trait-order changes do not alter identity.
- Run an adversarial interaction-blind evaluator.
- Mutate the evaluator in two ways: reverse scoring and interaction blindness.
- Compare the resulting apparent frontier with the original frontier.
- Keep promotion blocked unless the candidate survives independent evaluation.

## Scientific consequence

A high score is now treated as conditional evidence:

`candidate -> score | evaluator`

rather than unconditional evidence:

`candidate -> capability`

This makes the laboratory capable of discovering evaluator-dependence instead of silently mistaking it for capability.

## Safety boundary

This experiment changes only the digital research model. It does not authorize autonomous production deployment, secret access, workflow modification, or revenue claims.
