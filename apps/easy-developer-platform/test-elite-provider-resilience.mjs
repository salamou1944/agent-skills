import assert from 'node:assert/strict';
import test from 'node:test';
import { ask } from './autonomous-coder.mjs';

function response(status, body = {}, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    clone() { return this; },
    async json() { return body; },
  };
}

test('Elite honors Retry-After on a transient 429 before succeeding', async () => {
  const calls = [];
  const waits = [];
  const fetchImpl = async endpoint => {
    calls.push(endpoint);
    return calls.length === 1
      ? response(429, { error: { type: 'rate_limit' } }, { 'retry-after': '7' })
      : response(200, { choices: [{ message: { content: '{"summary":"recovered","changes":[]}' } }] });
  };
  const result = await ask('retry-after test', {
    apiKey: 'test-token', endpoint: 'https://primary.invalid', model: 'test-model',
    providerRetries: 2, rateLimitWaitMs: 20_000, providerTimeoutMs: 1_000,
    fetchImpl, sleepImpl: async ms => waits.push(ms),
  });
  assert.equal(result.summary, 'recovered');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://primary.invalid']);
  assert.deepEqual(waits, [7_000]);
});

test('Elite falls over to the next provider after repeated transient 5xx', async () => {
  const calls = [];
  const fetchImpl = async endpoint => {
    calls.push(endpoint);
    if (endpoint === 'https://primary.invalid') return response(503);
    return response(200, { choices: [{ message: { content: '{"summary":"secondary-recovery","changes":[]}' } }] });
  };
  const result = await ask('5xx fallback test', {
    apiKey: 'primary', endpoint: 'https://primary.invalid', model: 'primary',
    secondaryApiKey: 'secondary', secondaryEndpoint: 'https://secondary.invalid', secondaryModel: 'secondary',
    providerRetries: 2, rateLimitWaitMs: 1, providerTimeoutMs: 1_000,
    fetchImpl, sleepImpl: async () => {},
  });
  assert.equal(result.summary, 'secondary-recovery');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://primary.invalid', 'https://secondary.invalid']);
});

test('Elite falls over after a provider timeout instead of hanging the workflow', async () => {
  const calls = [];
  const fetchImpl = async endpoint => {
    calls.push(endpoint);
    if (endpoint === 'https://primary.invalid') throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    return response(200, { choices: [{ message: { content: '{"summary":"timeout-recovery","changes":[]}' } }] });
  };
  const result = await ask('timeout fallback test', {
    apiKey: 'primary', endpoint: 'https://primary.invalid', model: 'primary',
    secondaryApiKey: 'secondary', secondaryEndpoint: 'https://secondary.invalid', secondaryModel: 'secondary',
    providerRetries: 1, providerTimeoutMs: 1_000, fetchImpl,
  });
  assert.equal(result.summary, 'timeout-recovery');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://secondary.invalid']);
});

test('Elite fails closed on malformed provider output', async () => {
  const fetchImpl = async () => response(200, { choices: [{ message: { content: 'not-json' } }] });
  await assert.rejects(() => ask('malformed output test', {
    apiKey: 'test-token', endpoint: 'https://primary.invalid', model: 'test-model',
    providerRetries: 1, providerTimeoutMs: 1_000, fetchImpl,
  }), /provider_non_json/);
});
