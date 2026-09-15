import assert from 'node:assert/strict';
import { withRevenueApi } from './integration-harness.mjs';

await withRevenueApi(async (base) => {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const created = await fetch(`${base}/opportunity`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Runtime test offer', source: 'test', description: 'Legitimate test opportunity.' })
  });
  assert.equal(created.status, 200);
  const opportunity = await created.json();
  assert.equal(opportunity.status, 'discovered');

  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 405);

  const malformed = await fetch(`${base}/opportunity`, { method: 'POST', body: '{' });
  assert.equal(malformed.status, 400);
});

console.log('revenue-api: runtime integration tests passed');
