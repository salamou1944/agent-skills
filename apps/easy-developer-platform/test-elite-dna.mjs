import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { buildEngineeringDNA, predictImpact, rejectRepeatedStrategy, createProof, shadowDelta } from './elite-dna.mjs';

const hash = value => createHash('sha256').update(String(value)).digest('hex');

test('Engineering DNA fingerprints dependency hotspots and predicts impact', async () => {
  const dna = await buildEngineeringDNA({ root: process.cwd(), files: ['a.mjs', 'b.mjs', 'c.test.mjs'], imports: { 'a.mjs': ['b.mjs'], 'c.test.mjs': ['b.mjs'] }, goal: 'change a' });
  assert.equal(dna.fileCount, 3);
  assert.equal(dna.dnaHash.length, 64);
  const impact = predictImpact({ dna, changedFiles: ['a.mjs'] });
  assert.deepEqual(impact.affectedFiles, ['a.mjs', 'b.mjs']);
  assert.equal(impact.riskSignals[0].path, 'b.mjs');
});

test('failed strategies are not silently repeated', () => {
  const plan = { summary: 'same' };
  const message = 'broken';
  const ledger = [{ planHash: hash(JSON.stringify(plan)), failureHash: hash(message), failureCode: 'test_failed' }];
  const result = rejectRepeatedStrategy(ledger, { plan, failureCode: 'test_failed', failureMessage: message });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'repeated_failed_strategy');
});

test('proof is tamper-evident and shadow delta is explicit', () => {
  const proof = createProof({ goal: 'x', result: { status: 'verified', changedFiles: ['a.mjs'] }, dna: { dnaHash: 'd' }, impact: { predictionHash: 'p' }, tests: ['test:x'] });
  assert.equal(proof.proofHash.length, 64);
  const delta = shadowDelta({ prediction: { affectedFiles: ['a.mjs', 'b.mjs'] }, actualFiles: ['a.mjs', 'c.mjs'] });
  assert.deepEqual(delta.matched, ['a.mjs']);
  assert.deepEqual(delta.missed, ['c.mjs']);
  assert.deepEqual(delta.falsePositives, ['b.mjs']);
});
