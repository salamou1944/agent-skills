import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPipelineVerified, assertTaskVerified, classifyResult } from './task-result-gate.mjs';

test('pipeline verification is not task verification', () => {
  const result = { status: 'PIPELINE_VERIFIED' };
  assert.deepEqual(classifyResult(result), { taskVerified: false, pipelineVerified: true, status: 'PIPELINE_VERIFIED' });
  assertPipelineVerified(result);
  assert.throws(() => assertTaskVerified(result), /elite_task_not_proven/);
});

test('verified task is task and pipeline verified', () => {
  const result = { status: 'VERIFIED', changedFiles: ['src/example.mjs'] };
  assert.deepEqual(classifyResult(result), { taskVerified: true, pipelineVerified: true, status: 'VERIFIED' });
  assertTaskVerified(result);
});

test('verified noop is explicit and can be disallowed', () => {
  const result = { status: 'VERIFIED_NOOP' };
  assertTaskVerified(result);
  assert.throws(() => assertTaskVerified(result, { allowNoop: false }), /elite_noop_not_allowed/);
});
