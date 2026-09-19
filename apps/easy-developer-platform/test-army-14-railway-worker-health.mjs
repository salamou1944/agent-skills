import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArmy14Health, classifyArmy14CycleFailure } from './army-14-railway-worker.mjs';

test('health exposes Railway deployment commit and healthy state', () => {
  const health = buildArmy14Health({ startedAt: '2026-09-19T00:00:00.000Z', running: false, intervalMs: 300000, deployedCommit: 'abc123', lastRun: { status: 'OK' }, failures: 0, lastFailure: null });
  assert.equal(health.status, 'running');
  assert.equal(health.deployedCommit, 'abc123');
  assert.equal(health.sourceDriftDetected, false);
});

test('source verification failure is degraded and explicitly marked as drift', () => {
  const failure = classifyArmy14CycleFailure('repository_verification_failed:syntax_failed:foo.mjs');
  const health = buildArmy14Health({ startedAt: '2026-09-19T00:00:00.000Z', running: false, intervalMs: 300000, deployedCommit: 'stale', lastRun: { status: 'FAILED' }, failures: 1, lastFailure: failure });
  assert.equal(health.status, 'degraded');
  assert.equal(health.failureCode, 'SOURCE_VERIFICATION_FAILED');
  assert.equal(health.sourceDriftDetected, true);
  assert.equal(health.retryable, false);
});

test('provider quota failure is not misclassified as source drift', () => {
  const failure = classifyArmy14CycleFailure('429 credit_balance_exhausted');
  const health = buildArmy14Health({ startedAt: '2026-09-19T00:00:00.000Z', running: false, intervalMs: 300000, deployedCommit: 'current', lastRun: { status: 'FAILED' }, failures: 1, lastFailure: failure });
  assert.equal(health.failureCode, 'EXTERNAL_PROVIDER_RATE_LIMIT');
  assert.equal(health.sourceDriftDetected, false);
  assert.equal(health.retryable, true);
});
