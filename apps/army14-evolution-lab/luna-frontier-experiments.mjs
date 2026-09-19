import { phenotype, phenotypeHash, genomeHash } from './digital-evolution.mjs';

export const OPTIONAL_TRAITS = Object.freeze([
  'counterfactual',
  'cross-soldier',
  'heldout',
  'adversarial',
  'resumable',
  'diversity',
  'negative-knowledge',
]);

export const BASELINE = Object.freeze({
  traits: ['contract', 'verification', 'recovery'],
});

function combinations(items) {
  const result = [];
  for (let mask = 0; mask < (1 << items.length); mask += 1) {
    result.push({
      traits: [
        'contract',
        'verification',
        'recovery',
        ...items.filter((_, index) => (mask & (1 << index)) !== 0),
      ].sort(),
    });
  }
  return result;
}

function has(genome, trait) {
  return genome.traits.includes(trait);
}

export function evaluateFrontierGenome(genome) {
  const p = phenotype(genome);
  const t = new Set(genome.traits);

  const singleTraitGain =
    OPTIONAL_TRAITS.filter((trait) => t.has(trait)).length;

  const interactionGain =
    (has(genome, 'counterfactual') && has(genome, 'adversarial') ? 3 : 0) +
    (has(genome, 'cross-soldier') && has(genome, 'diversity') ? 3 : 0) +
    (has(genome, 'heldout') && has(genome, 'negative-knowledge') ? 3 : 0) +
    (has(genome, 'resumable') && has(genome, 'negative-knowledge') ? 2 : 0);

  const heldOut =
    (has(genome, 'counterfactual') && has(genome, 'adversarial') && has(genome, 'heldout') ? 4 : 0) +
    (has(genome, 'cross-soldier') && has(genome, 'diversity') && has(genome, 'heldout') ? 4 : 0) +
    (has(genome, 'resumable') && has(genome, 'negative-knowledge') && has(genome, 'heldout') ? 4 : 0);

  const metamorphic =
    p.behaviors.includes('submit-to-independent-heldout-evaluation') &&
    p.behaviors.includes('attack-before-promotion') &&
    p.behaviors.includes('retain-failure-lineage')
      ? 3
      : 0;

  return {
    score: singleTraitGain + interactionGain + heldOut + metamorphic,
    components: { singleTraitGain, interactionGain, heldOut, metamorphic },
  };
}

export function runLunaFrontierExperiment() {
  const genomes = combinations(OPTIONAL_TRAITS);
  const baselineScore = evaluateFrontierGenome(BASELINE).score;

  const observations = genomes.map((genome) => ({
    genome,
    genomeHash: genomeHash(genome),
    phenotypeHash: phenotypeHash(genome),
    evaluation: evaluateFrontierGenome(genome),
  }));

  const independentSingleTrait = Object.fromEntries(
    OPTIONAL_TRAITS.map((trait) => {
      const genome = {
        traits: ['contract', 'verification', 'recovery', trait].sort(),
      };
      return [trait, evaluateFrontierGenome(genome).score];
    }),
  );

  const interactionCandidates = observations
    .map((observation) => {
      const optional = observation.genome.traits.filter((trait) => OPTIONAL_TRAITS.includes(trait));
      const pairwiseSynergy = optional.reduce((sum, a, index) => (
        sum + optional.slice(index + 1).reduce((inner, b) => {
          const aOnly = independentSingleTrait[a] ?? 0;
          const bOnly = independentSingleTrait[b] ?? 0;
          const pairGenome = {
            traits: ['contract', 'verification', 'recovery', a, b].sort(),
          };
          const pairScore = evaluateFrontierGenome(pairGenome).score;
          return inner + Math.max(0, pairScore - aOnly - bOnly + baselineScore);
        }, 0)
      ), 0);

      return { ...observation, pairwiseSynergy };
    })
    .filter((x) => x.pairwiseSynergy > 0)
    .sort((a, b) => b.pairwiseSynergy - a.pairwiseSynergy || b.evaluation.score - a.evaluation.score);

  const heldOutTop = observations
    .filter((x) => x.evaluation.components.heldOut > 0)
    .sort((a, b) => b.evaluation.components.heldOut - a.evaluation.components.heldOut || b.evaluation.score - a.evaluation.score)
    .slice(0, 10);

  return {
    experiment: 'LUNA-FRONTIER-001',
    question: 'Can interacting heritable traits create a capability signal not explained by isolated trait gains?',
    baseline: {
      genomeHash: genomeHash(BASELINE),
      phenotypeHash: phenotypeHash(BASELINE),
      score: baselineScore,
    },
    searchSpace: {
      optionalTraits: OPTIONAL_TRAITS.length,
      genomesEvaluated: genomes.length,
    },
    independentSingleTrait,
    interactionCandidates: interactionCandidates.slice(0, 10),
    heldOutTop,
    selectionRule: 'No candidate is promotable from this experiment alone; claimed emergence requires independent held-out replay and lineage evidence.',
  };
}
