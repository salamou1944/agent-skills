import assert from 'node:assert/strict';
import { BASELINE, OPTIONAL_TRAITS, runLunaFrontierExperiment } from './luna-frontier-experiments.mjs';

const result = runLunaFrontierExperiment();

assert.equal(result.experiment, 'LUNA-FRONTIER-001');
assert.equal(result.searchSpace.genomesEvaluated, 2 ** OPTIONAL_TRAITS.length);
assert.equal(result.baseline.score, 0);
assert.ok(result.interactionCandidates.length > 0, 'interaction search must discover a non-additive candidate');
assert.ok(result.heldOutTop.length > 0, 'held-out probe must identify candidates');
assert.deepEqual(BASELINE.traits.sort(), ['contract', 'recovery', 'verification']);

for (const candidate of result.interactionCandidates) {
  assert.ok(candidate.pairwiseSynergy > 0);
  assert.ok(candidate.genomeHash);
  assert.ok(candidate.phenotypeHash);
}

for (const candidate of result.heldOutTop) {
  assert.ok(candidate.evaluation.components.heldOut > 0);
}

console.log(JSON.stringify({
  experiment: result.experiment,
  genomesEvaluated: result.searchSpace.genomesEvaluated,
  interactionCandidates: result.interactionCandidates.length,
  heldOutCandidates: result.heldOutTop.length,
  topInteraction: result.interactionCandidates[0]?.genome.traits,
  topHeldOut: result.heldOutTop[0]?.genome.traits,
}, null, 2));
