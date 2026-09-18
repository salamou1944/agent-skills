import assert from 'node:assert/strict';
import test from 'node:test';
import { FAULT_MATRIX, expectedFaultAction } from './fault-matrix.mjs';

test('fault matrix covers provider, verification, workspace, policy, and dependency failures', () => {
  const ids = new Set(FAULT_MATRIX.map(x => x.id));
  for (const id of ['provider-429','provider-timeout','provider-410','malformed-provider-output','test-regression','workspace-drift','permission-denial','missing-dependency']) {
    assert.ok(ids.has(id), 'missing fault: ' + id);
  }
});

test('non-retryable faults are not retryable by accident', () => {
  assert.equal(FAULT_MATRIX.find(x => x.id === 'provider-410').retryable, false);
  assert.equal(FAULT_MATRIX.find(x => x.id === 'permission-denial').retryable, false);
});

test('every fault has an explicit terminal action', () => {
  for (const fault of FAULT_MATRIX) assert.equal(expectedFaultAction(fault.id), fault.expected);
});
