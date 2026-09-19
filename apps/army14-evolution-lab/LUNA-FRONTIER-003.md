# LUNA-FRONTIER-003 — Unknown Capability Discovery

The laboratory now separates **named mutation discovery** from **behavioral novelty discovery**.

## Question

Can the system find a behavior pattern that is not reducible to the frozen baseline or any single named trait, and convert that observation into falsifiable hypotheses rather than prematurely naming it a capability?

## Method

1. Exhaustively enumerate the 128 genomes in the current seven-trait search space.
2. Convert each genome into a behavioral vector.
3. Compare each vector with the baseline and every single-trait mutation.
4. Flag composite behavior patterns whose nearest atomic reference is at least two behavioral dimensions away.
5. Generate explicit hypotheses only when observable trait interactions justify them.
6. Generate an evaluator counterexample by removing interaction terms from the score.
7. Preserve a lineage and evidence requirements for every discovery.

## Important distinction

A **novel phenotype** is not automatically a new capability.

The experiment can establish:

- behavioral novelty relative to the frozen model,
- distance from atomic mutations,
- evaluator dependence,
- candidate hypotheses,
- required falsification tests.

It cannot establish general intelligence, real-world capability, or novelty relative to all software/AI systems.

## Promotion boundary

A discovery remains a research hypothesis until it has:

- independent held-out replay,
- adversarial counterexample testing,
- reproducible lineage,
- evaluator mutation,
- and a promotion decision that remains valid across those checks.

This keeps the evolutionary loop capable of discovering things the trait vocabulary did not explicitly name without allowing the evaluator to declare its own discoveries true.
