import assert from 'node:assert/strict';
import { runUnknownCapabilityDiscovery } from './luna-unknown-capability-discovery.mjs';

const result = runUnknownCapabilityDiscovery();

assert.equal(result.experiment, 'LUNA-FRONTIER-003');
assert.equal(result.searchSpace.genomesEvaluated, 128);
assert.ok(result.discovery.candidates > 0, 'discovery must find composite behavior candidates');
assert.equal(
  result.discovery.uniquePhenotypes,
  result.discovery.candidates,
  'each discovered candidate should have a distinct behavior phenotype in this model',
);
assert.ok(
  result.discovery.evaluatorDependentCandidates > 0,
  'at least one discovered candidate should expose evaluator-visible interaction dependence',
);

for (const candidate of result.candidates) {
  assert.ok(candidate.genomeHash);
  assert.ok(candidate.phenotypeHash);
  assert.ok(candidate.nearestAtomicDistance >= 2);
  assert.ok(candidate.lineage.evidenceRequired.includes('evaluator_mutation'));
  assert.ok(candidate.adversarialCounterexample.counterexample);
}

console.log(JSON.stringify({
  experiment: result.experiment,
  genomesEvaluated: result.searchSpace.genomesEvaluated,
  discoveredCandidates: result.discovery.candidates,
  uniquePhenotypes: result.discovery.uniquePhenotypes,
  evaluatorDependentCandidates: result.discovery.evaluatorDependentCandidates,
  topCandidate: result.candidates[0]?.genome.traits,
  topHypotheses: result.candidates[0]?.evaluatorHypotheses,
}, null, 2));
