import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyArmy14CycleFailure } from './army-14-railway-worker.mjs';

test('classifies repository syntax verification failures as source-drift blockers', () => {
  const result = classifyArmy14CycleFailure({
    error: 'repository_verification_failed:syntax_failed:apps/easy-developer-platform/elite-deployment-recovery.mjs',
  });
  assert.equal(result.code, 'SOURCE_VERIFICATION_FAILED');
  assert.equal(result.retryable, false);
});

test('classifies provider rate limits without treating them as repository failure', () => {
  const result = classifyArmy14CycleFailure({ error: 'provider_http_429' });
  assert.equal(result.code, 'EXTERNAL_PROVIDER_RATE_LIMIT');
  assert.equal(result.retryable, true);
});

test('unknown failures remain explicit and retryable by default', () => {
  const result = classifyArmy14CycleFailure({ error: 'unexpected_failure' });
  assert.equal(result.code, 'UNKNOWN');
  assert.equal(result.retryable, true);
});

console.log('army-14 railway worker tests passed');
