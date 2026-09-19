import assert from 'node:assert/strict';
import { phenotypeHash, genomeHash, phenotype } from './digital-evolution.mjs';
import { BASELINE, OPTIONAL_TRAITS, evaluateFrontierGenome } from './luna-frontier-experiments.mjs';

export const EXPERIMENT = 'LUNA-FRONTIER-002';

function mutateEvaluator(evaluator, mutation) {
  if (mutation === 'reverse') {
    return (genome) => {
      const r = evaluator(genome);
      return { ...r, score: -r.score };
    };
  }
  if (mutation === 'interaction-blind') {
    return (genome) => {
      const r = evaluator(genome);
      return { ...r, score: r.components.singleTraitGain };
    };
  }
  throw new Error('unknown_evaluator_mutation');
}

function candidateSpace() {
  return Array.from({ length: 1 << OPTIONAL_TRAITS.length }, (_, mask) => ({
    traits: [
      'contract', 'verification', 'recovery',
      ...OPTIONAL_TRAITS.filter((_, i) => (mask & (1 << i)) !== 0),
    ].sort(),
  }));
}

function metamorphicProbe(genome) {
  const p = phenotype(genome);
  const reordered = { traits: [...genome.traits].reverse() };
  return {
    stableGenomeHash: genomeHash(genome) === genomeHash(reordered),
    stablePhenotypeHash: phenotypeHash(genome) === phenotypeHash(reordered),
    behaviorCount: p.behaviors.length,
  };
}

function adversarialProbe(genome) {
  const base = evaluateFrontierGenome(genome);
  const mutatedEvaluator = mutateEvaluator(evaluateFrontierGenome, 'interaction-blind');
  const blind = mutatedEvaluator(genome);
  return {
    originalScore: base.score,
    evaluatorBlindScore: blind.score,
    interactionDependency: base.components.interactionGain > 0,
    detectableEvaluatorFailure: base.score !== blind.score,
  };
}

export function runMetaEvolutionExperiment() {
  const space = candidateSpace();
  const baseline = evaluateFrontierGenome(BASELINE);

  const observations = space.map((genome) => {
    const score = evaluateFrontierGenome(genome);
    const metamorphic = metamorphicProbe(genome);
    const adversarial = adversarialProbe(genome);
    return {
      genome,
      genomeHash: genomeHash(genome),
      phenotypeHash: phenotypeHash(genome),
      score,
      metamorphic,
      adversarial,
    };
  });

  const valid = observations.filter((x) =>
    x.metamorphic.stableGenomeHash &&
    x.metamorphic.stablePhenotypeHash
  );

  const evaluatorFailureDetectable = valid.filter((x) =>
    !x.adversarial.interactionDependency || x.adversarial.detectableEvaluatorFailure
  );

  const evaluatorSensitive = observations.filter((x) =>
    x.adversarial.interactionDependency && x.adversarial.detectableEvaluatorFailure
  );

  const originalWinner = observations
    .slice()
    .sort((a, b) => b.score.score - a.score.score || a.genomeHash.localeCompare(b.genomeHash))[0]?.genomeHash;

  const evaluatorMutations = ['reverse', 'interaction-blind'].map((mutation) => {
    const mutated = mutateEvaluator(evaluateFrontierGenome, mutation);
    const ranked = observations.map((x) => ({
      genomeHash: x.genomeHash,
      score: mutated(x.genome).score,
    })).sort((a, b) => b.score - a.score || a.genomeHash.localeCompare(b.genomeHash));
    return {
      mutation,
      topGenomeHash: ranked[0]?.genomeHash,
      topScore: ranked[0]?.score,
      changesWinner: ranked[0]?.genomeHash !== originalWinner,
    };
  });

  return {
    experiment: EXPERIMENT,
    question: 'Can the evolutionary laboratory detect when its own evaluator changes the apparent frontier?',
    baseline: {
      genomeHash: genomeHash(BASELINE),
      phenotypeHash: phenotypeHash(BASELINE),
      score: baseline.score,
    },
    population: observations.length,
    metamorphic: {
      validCandidates: valid.length,
      totalCandidates: observations.length,
    },
    adversarial: {
      evaluatorFailureDetectableCandidates: evaluatorFailureDetectable.length,
      evaluatorSensitiveCandidates: evaluatorSensitive.length,
    },
    evaluatorMutations,
    promotionRule: 'Evaluator mutation can invalidate a frontier; no promotion is permitted from a single evaluator.',
  };
}

const result = runMetaEvolutionExperiment();
assert.equal(result.experiment, EXPERIMENT);
assert.equal(result.population, 128);
assert.equal(result.metamorphic.validCandidates, 128);
assert.ok(result.adversarial.evaluatorSensitiveCandidates > 0);
assert.equal(result.baseline.score, 0);
console.log(JSON.stringify(result, null, 2));
