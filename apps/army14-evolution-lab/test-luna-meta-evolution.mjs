import assert from 'node:assert/strict';
import { runMetaEvolutionExperiment } from './luna-meta-evolution.mjs';

const result = runMetaEvolutionExperiment();

assert.equal(result.population, 128);
assert.equal(result.metamorphic.validCandidates, 128);
assert.ok(result.adversarial.evaluatorSensitiveCandidates > 0);
assert.ok(result.evaluatorMutations.every((x) => x.topGenomeHash && Number.isFinite(x.topScore)));

console.log(JSON.stringify({
  experiment: result.experiment,
  population: result.population,
  metamorphicStable: result.metamorphic.validCandidates,
  evaluatorSensitive: result.adversarial.evaluatorSensitiveCandidates,
  evaluatorMutations: result.evaluatorMutations,
}, null, 2));
