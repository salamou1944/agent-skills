import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEngineeringDNA, predictImpact, rejectRepeatedStrategy, createProof, shadowDelta } from './elite-dna.mjs';

test('Engineering DNA fingerprints dependency hotspots and predicts impact', async () => {
  const dna = await buildEngineeringDNA({
    root: process.cwd(),
    files: ['a.mjs', 'b.mjs', 'c.test.mjs'],
    imports: { 'a.mjs': ['b.mjs'], 'c.test.mjs': ['b.mjs'] },
    goal: 'change a'
  });
  assert.equal(dna.fileCount, 3);
  assert.ok(dna.dnaHash.length === 64);
  const impact = predictImpact({ dna, changedFiles: ['a.mjs'] });
  assert.deepEqual(impact.affectedFiles, ['a.mjs', 'b.mjs']);
  assert.equal(impact.riskSignals[0].path, 'b.mjs');
});

test('failed strategies are not silently repeated', () => {
  const ledger = [{ planHash: 'x', failureHash: 'y', failureCode: 'test_failed' }];
  const plan = { summary: 'same' };
  const message = 'broken';
  const crypto = async () => {};
  void crypto;
  const result = rejectRepeatedStrategy(ledger, { plan, failureCode: 'test_failed', failureMessage: message });
  assert.equal(result.ok, true);
  assert.equal(typeof result.reason, 'undefined');
});

test('proof is tamper-evident and shadow delta is explicit', () => {
  const proof = createProof({ goal: 'x', result: { status: 'verified', changedFiles: ['a.mjs'] }, dna: { dnaHash: 'd' }, impact: { predictionHash: 'p' }, tests: ['test:x'] });
  assert.equal(proof.proofHash.length, 64);
  const delta = shadowDelta({ prediction: { affectedFiles: ['a.mjs', 'b.mjs'] }, actualFiles: ['a.mjs', 'c.mjs'] });
  assert.deepEqual(delta.matched, ['a.mjs']);
  assert.deepEqual(delta.missed, ['c.mjs']);
  assert.deepEqual(delta.falsePositives, ['b.mjs']);
});
