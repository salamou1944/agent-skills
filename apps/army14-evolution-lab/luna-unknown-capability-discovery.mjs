import { genomeHash, phenotype, phenotypeHash } from './digital-evolution.mjs';
import { BASELINE, OPTIONAL_TRAITS, evaluateFrontierGenome } from './luna-frontier-experiments.mjs';

export const EXPERIMENT = 'LUNA-FRONTIER-003';

function candidateSpace() {
  return Array.from({ length: 1 << OPTIONAL_TRAITS.length }, (_, mask) => ({
    traits: [
      'contract',
      'verification',
      'recovery',
      ...OPTIONAL_TRAITS.filter((_, i) => (mask & (1 << i)) !== 0),
    ].sort(),
  }));
}

function behaviorVector(genome) {
  return phenotype(genome).behaviors.map((behavior) => behavior);
}

function signature(genome) {
  return JSON.stringify(behaviorVector(genome));
}

function hammingDistance(a, b) {
  let distance = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance;
}

function singleTraitGenomes() {
  return OPTIONAL_TRAITS.map((trait) => ({
    traits: ['contract', 'verification', 'recovery', trait].sort(),
  }));
}

function discoverNovelBehaviorCandidates(population) {
  const baselineSignature = signature(BASELINE);
  const singleSignatures = new Set(singleTraitGenomes().map(signature));

  return population
    .map((genome) => {
      const current = signature(genome);
      const novelRelativeToAtomicChanges =
        current !== baselineSignature && !singleSignatures.has(current);

      const nearestAtomicDistance = Math.min(
        hammingDistance(behaviorVector(genome), behaviorVector(BASELINE)),
        ...singleTraitGenomes().map((single) =>
          hammingDistance(behaviorVector(genome), behaviorVector(single))
        ),
      );

      return {
        genome,
        genomeHash: genomeHash(genome),
        phenotypeHash: phenotypeHash(genome),
        behaviorSignature: current,
        behaviorVector: behaviorVector(genome),
        novelRelativeToAtomicChanges,
        nearestAtomicDistance,
      };
    })
    .filter((x) => x.novelRelativeToAtomicChanges && x.nearestAtomicDistance >= 2)
    .sort((a, b) =>
      b.nearestAtomicDistance - a.nearestAtomicDistance ||
      a.genomeHash.localeCompare(b.genomeHash)
    );
}

function generateEvaluatorHypotheses(candidate) {
  const traits = new Set(candidate.genome.traits);
  const hypotheses = [];

  if (traits.has('counterfactual') && traits.has('adversarial')) {
    hypotheses.push({
      hypothesis: 'planning-under-counterfactual-attack',
      observableSignal: 'alternative-generation plus attack-before-promotion',
      falsifier: 'remove either trait and retest on held-out probes',
    });
  }

  if (traits.has('cross-soldier') && traits.has('diversity')) {
    hypotheses.push({
      hypothesis: 'multi-agent-diversity-composition',
      observableSignal: 'cross-agent composition plus alternative-lineage preservation',
      falsifier: 'collapse lineage diversity while holding other traits constant',
    });
  }

  if (traits.has('heldout') && traits.has('negative-knowledge') && traits.has('resumable')) {
    hypotheses.push({
      hypothesis: 'persistent-learning-under-independent-evaluation',
      observableSignal: 'held-out evaluation plus retained failure lineage plus resume',
      falsifier: 'erase failure lineage or restart from a clean checkpoint',
    });
  }

  return hypotheses;
}

function adversarialCounterexample(candidate) {
  const normal = evaluateFrontierGenome(candidate.genome);
  const interactionBlind = normal.components.singleTraitGain;
  const full = normal.score;

  return {
    fullScore: full,
    interactionBlindScore: interactionBlind,
    hiddenInteractionSignal: full - interactionBlind,
    counterexample:
      full !== interactionBlind
        ? 'candidate score depends on evaluator-visible interaction terms'
        : 'no interaction dependence detected by this evaluator',
  };
}

export function runUnknownCapabilityDiscovery() {
  const population = candidateSpace();
  const discovered = discoverNovelBehaviorCandidates(population);

  const records = discovered.map((candidate) => ({
    ...candidate,
    evaluatorHypotheses: generateEvaluatorHypotheses(candidate),
    adversarialCounterexample: adversarialCounterexample(candidate),
    lineage: {
      parent: genomeHash(BASELINE),
      operators: ['multi-trait-composition'],
      evidenceRequired: [
        'independent_heldout_replay',
        'adversarial_counterexample',
        'reproducible_lineage',
        'evaluator_mutation',
      ],
    },
  }));

  const uniquePhenotypes = new Set(records.map((x) => x.phenotypeHash));
  const evaluatorDependent = records.filter(
    (x) => x.adversarialCounterexample.hiddenInteractionSignal > 0,
  );

  return {
    experiment: EXPERIMENT,
    question:
      'Can the laboratory discover a behavior pattern that is not reducible to the baseline or any single named mutation, then turn that observation into falsifiable evaluator hypotheses?',
    searchSpace: {
      optionalTraits: OPTIONAL_TRAITS.length,
      genomesEvaluated: population.length,
    },
    discovery: {
      candidates: records.length,
      uniquePhenotypes: uniquePhenotypes.size,
      evaluatorDependentCandidates: evaluatorDependent.length,
    },
    candidates: records.slice(0, 20),
    promotionRule:
      'Discovery is a hypothesis generator only. No candidate is promoted as a new capability without independent held-out replay, adversarial counterexample testing, reproducible lineage, and evaluator mutation.',
  };
}
