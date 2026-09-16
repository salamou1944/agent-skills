import assert from 'node:assert/strict';
import test from 'node:test';
import { createHttpProviderAdapter, signRevenueEvent, verifyRevenueEventSignature } from './live-provider-adapters.mjs';

function response(status = 200, body = '', headers = {}) {
  const normalized = new Headers(headers);
  return { ok: status >= 200 && status < 300, status, headers: normalized, async text() { return body; } };
}

test('live adapter fails closed when endpoint is absent', async () => {
  delete process.env.REVENUE_DISCOVERY_URL;
  const adapter = createHttpProviderAdapter('discovery', { fetchImpl: async () => response() });
  const health = await adapter.healthCheck();
  assert.equal(health.ok, false);
  assert.equal(health.reason, 'endpoint_missing');
});

test('live adapter requires HTTPS endpoints', async () => {
  process.env.REVENUE_BILLING_URL = 'http://billing.invalid';
  const adapter = createHttpProviderAdapter('billing', { fetchImpl: async () => response() });
  const health = await adapter.healthCheck();
  assert.equal(health.ok, false);
  assert.match(health.reason, /requires_https/);
  delete process.env.REVENUE_BILLING_URL;
});

test('live adapter performs authenticated health check and POST execution', async () => {
  process.env.REVENUE_PUBLISHING_URL = 'https://publisher.example.test/health';
  process.env.REVENUE_PUBLISHING_TOKEN = 'test-token';
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return response(200, JSON.stringify({ externalId: 'pub_1' }));
  };
  const adapter = createHttpProviderAdapter('publishing', { fetchImpl });
  assert.equal((await adapter.healthCheck()).ok, true);
  const result = await adapter.execute({ action: 'publish', payload: { title: 'verified' } });
  assert.equal(result.externalId, 'pub_1');
  assert.equal(result.attempts, 1);
  assert.equal(calls[1].options.headers.authorization, 'Bearer test-token');
  delete process.env.REVENUE_PUBLISHING_URL;
  delete process.env.REVENUE_PUBLISHING_TOKEN;
});

test('live adapter retries transient 429 and succeeds without human intervention', async () => {
  process.env.REVENUE_ANALYTICS_URL = 'https://analytics.example.test';
  let attempts = 0;
  const sleeps = [];
  const adapter = createHttpProviderAdapter('analytics', {
    retries: 2,
    sleep: async (ms) => sleeps.push(ms),
    fetchImpl: async () => {
      attempts += 1;
      return attempts === 1 ? response(429, '', { 'retry-after': '0' }) : response(200, JSON.stringify({ eventId: 'evt_live_1' }));
    }
  });
  const result = await adapter.execute({ event: 'sale' });
  assert.equal(result.ok, true);
  assert.equal(result.eventId, 'evt_live_1');
  assert.equal(result.attempts, 2);
  assert.equal(attempts, 2);
  assert.deepEqual(sleeps, [0]);
  delete process.env.REVENUE_ANALYTICS_URL;
});

test('provider HTTP failures remain explicit after retry budget is exhausted', async () => {
  process.env.REVENUE_ANALYTICS_URL = 'https://analytics.example.test';
  const adapter = createHttpProviderAdapter('analytics', { retries: 1, sleep: async () => {}, fetchImpl: async () => response(429) });
  await assert.rejects(() => adapter.execute({ event: 'sale' }), (error) => error.message === 'provider_http_429' && error.status === 429 && error.attempts === 2);
  delete process.env.REVENUE_ANALYTICS_URL;
});

test('revenue webhook signatures are tamper resistant', () => {
  const payload = { provider: 'billing', externalEventId: 'evt_1', amount: 25 };
  const signature = signRevenueEvent(payload, 'secret');
  assert.equal(verifyRevenueEventSignature(payload, signature, 'secret'), true);
  assert.equal(verifyRevenueEventSignature({ ...payload, amount: 26 }, signature, 'secret'), false);
});
