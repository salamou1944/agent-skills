import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDelivery } from './delivery-gate.mjs';
import { fingerprintPatch } from './independent-evidence-gate.mjs';

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

test('delivery gate allows only task verification plus independent evidence', () => {
  assert.deepEqual(evaluateDelivery(valid).status, 'DELIVERY_ALLOWED');
});

test('delivery gate blocks pipeline-only completion', () => {
  assert.deepEqual(evaluateDelivery({ status: 'PIPELINE_VERIFIED' }).status, 'DELIVERY_BLOCKED');
});

test('delivery gate blocks self-review and missing evidence', () => {
  const selfReviewed = {
    ...valid,
    evidence: valid.evidence.map(item =>
      item.kind === 'independent_review' ? { ...item, verifierId: valid.agentId } : item
    )
  };
  assert.deepEqual(evaluateDelivery(selfReviewed).status, 'DELIVERY_BLOCKED');
});

test('delivery gate can explicitly reject verified no-op deliveries', () => {
  assert.deepEqual(evaluateDelivery({ ...valid, status: 'VERIFIED_NOOP' }, { allowNoop: false }).status, 'DELIVERY_BLOCKED');
});
