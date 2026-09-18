import assert from 'node:assert/strict';
import test from 'node:test';
import { fingerprintPatch, validateEvidence, assertIndependentEvidence } from './independent-evidence-gate.mjs';

const patch = { files: ['example.mjs'], changes: ['deterministic repair'] };
const valid = {
  status: 'TASK_VERIFIED',
  agentId: 'generator-1',
  patch,
  patchFingerprint: fingerprintPatch(patch),
  taskAcceptance: { passed: true },
  tests: { passed: true },
  diff: { clean: true },
  evidence: [
    { kind: 'task_acceptance' },
    { kind: 'tests' },
    { kind: 'diff' },
    { kind: 'independent_review', verifierId: 'verifier-2' }
  ],
  benchmark: { groundTruthExposed: false, hiddenEvaluationLeaked: false }
};

test('independent evidence accepts complete evidence from a distinct verifier', () => {
  assert.equal(validateEvidence(valid).ok, true);
  assert.doesNotThrow(() => assertIndependentEvidence(valid));
});

test('independent evidence rejects incomplete or self-reviewed completion', () => {
  const incomplete = { ...valid, evidence: valid.evidence.slice(0, 3) };
  assert.equal(validateEvidence(incomplete).ok, false);
  const selfReviewed = {
    ...valid,
    evidence: valid.evidence.map(item => item.kind === 'independent_review' ? { ...item, verifierId: valid.agentId } : item)
  };
  assert.equal(validateEvidence(selfReviewed).ok, false);
});

test('independent evidence rejects a mismatched patch fingerprint', () => {
  assert.equal(validateEvidence({ ...valid, patchFingerprint: 'wrong' }).ok, false);
});
