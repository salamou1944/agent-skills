import { createHash } from 'node:crypto';

export const REQUIRED_TRAITS = Object.freeze([
  'contract',
  'verification',
  'recovery',
]);

const OPTIONAL_TRAITS = Object.freeze([
  'counterfactual',
  'cross-soldier',
  'heldout',
  'adversarial',
  'resumable',
  'diversity',
  'negative-knowledge',
]);

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function canonicalTraits(traits) {
  return [...new Set(traits)].sort();
}

function assertGenome(genome) {
  if (!genome || typeof genome !== 'object') throw new Error('genome_invalid');
  const traits = canonicalTraits(genome.traits);
  if (!REQUIRED_TRAITS.every((trait) => traits.includes(trait))) {
    throw new Error('genome_lost_required_trait');
  }
  return traits;
}

export function phenotype(genome) {
  const traits = assertGenome(genome);
  return {
    traits,
    behaviors: [
      traits.includes('counterfactual') ? 'generate-alternatives-before-selection' : 'single-path-planning',
      traits.includes('cross-soldier') ? 'compose-capabilities-across-agents' : 'single-agent-capability',
      traits.includes('heldout') ? 'submit-to-independent-heldout-evaluation' : 'self-contained-evaluation',
      traits.includes('adversarial') ? 'attack-before-promotion' : 'verify-before-promotion',
      traits.includes('resumable') ? 'checkpoint-and-resume' : 'restart-on-failure',
      traits.includes('negative-knowledge') ? 'retain-failure-lineage' : 'discard-failure-context',
      traits.includes('diversity') ? 'preserve-alternative-lineages' : 'collapse-to-best-observed-lineage',
    ],
  };
}

export function genomeHash(genome) {
  return hash({ traits: assertGenome(genome) });
}

export function phenotypeHash(genome) {
  return hash(phenotype(genome));
}

export function crossover(parentA, parentB) {
  const a = assertGenome(parentA);
  const b = assertGenome(parentB);
  const union = [...new Set([...a, ...b])];
  const traits = union.filter((_, index) => index % 2 === 0 || REQUIRED_TRAITS.includes(union[index]));
  return { traits: canonicalTraits(traits), operator: 'crossover' };
}

export function mutate(genome, mutation = {}) {
  const before = assertGenome(genome);
  const operation = mutation.operation ?? 'toggle';
  const target = mutation.trait ?? OPTIONAL_TRAITS[0];
  let next = [...before];

  if (!OPTIONAL_TRAITS.includes(target)) throw new Error('unknown_mutation_trait');

  if (operation === 'add') next.push(target);
  else if (operation === 'remove') next = next.filter((trait) => trait !== target);
  else if (operation === 'toggle') {
    next = next.includes(target) ? next.filter((trait) => trait !== target) : [...next, target];
  } else {
    throw new Error('unknown_mutation_operation');
  }

  const traits = canonicalTraits(next);
  assertGenome({ traits });
  return {
    traits,
    operator: 'point-mutation',
    mutation: { operation, trait: target },
    parentGenomeHash: genomeHash(genome),
  };
}

export function evaluateCandidate(candidate, evaluator, context = {}) {
  if (typeof evaluator !== 'function') throw new Error('independent_evaluator_required');
  const result = evaluator(phenotype(candidate), context);
  if (!result || typeof result.score !== 'number' || !Number.isFinite(result.score)) {
    throw new Error('invalid_independent_evaluation');
  }
  return Object.freeze({ ...result, genomeHash: genomeHash(candidate), phenotypeHash: phenotypeHash(candidate) });
}

export function evolveGeneration(population, evaluator, context = {}) {
  if (!Array.isArray(population) || population.length < 2) throw new Error('population_too_small');
  const children = [];

  for (let i = 0; i < population.length - 1; i += 1) {
    const parentA = population[i];
    const parentB = population[i + 1];
    const crossed = crossover(parentA, parentB);
    const trait = OPTIONAL_TRAITS[i % OPTIONAL_TRAITS.length];
    const operation = i % 2 === 0 ? 'add' : 'toggle';
    const child = mutate(crossed, { operation, trait });
    children.push({
      genome: { traits: child.traits },
      lineage: {
        parents: [genomeHash(parentA), genomeHash(parentB)],
        operators: ['crossover', 'point-mutation'],
        generation: context.generation ?? 0,
      },
      evaluation: evaluateCandidate(child, evaluator, context),
    });
  }

  const survivors = children
    .filter((x) => x.evaluation.accepted !== false)
    .sort((a, b) => b.evaluation.score - a.evaluation.score);

  return {
    generation: (context.generation ?? 0) + 1,
    candidates: children,
    survivors,
    diversity: new Set(children.map((x) => x.evaluation.phenotypeHash)).size,
  };
}

export function discoverEmergentCapability({ baselinePhenotypeHashes, candidate }) {
  const baseline = new Set(baselinePhenotypeHashes ?? []);
  const pHash = phenotypeHash(candidate);
  const traits = assertGenome(candidate);
  const emergent = !baseline.has(pHash) && traits.some((trait) => OPTIONAL_TRAITS.includes(trait));
  return {
    phenotypeHash: pHash,
    novelRelativeToBaseline: !baseline.has(pHash),
    emergentCapability: emergent,
    evidenceRequired: [
      'baseline_phenotype_hash',
      'independent_heldout_evaluation',
      'reproducible_replay',
      'lineage_record',
    ],
  };
}
