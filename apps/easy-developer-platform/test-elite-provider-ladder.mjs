import assert from 'node:assert/strict';
import test from 'node:test';
import { ask } from './autonomous-coder.mjs';

test('Elite rotates across a provider ladder after quota exhaustion', async () => {
  const calls = [];
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint);
    if (endpoint === 'https://primary.invalid') {
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        clone() { return this; },
        async json() { return { error: { code: 'insufficient_quota' } }; },
      };
    }
    if (endpoint === 'https://secondary.invalid') {
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        clone() { return this; },
        async json() { return { error: { code: 'quota_exceeded' } }; },
      };
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"third-provider","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test provider ladder', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    secondaryApiKey: 'secondary-test-token',
    secondaryEndpoint: 'https://secondary.invalid',
    secondaryModel: 'secondary-model',
    githubToken: 'third-test-token',
    githubEndpoint: 'https://third.invalid',
    githubModel: 'third-model',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    fetchImpl,
  });

  assert.equal(result.summary, 'third-provider');
  assert.deepEqual(calls, [
    'https://primary.invalid',
    'https://secondary.invalid',
    'https://third.invalid',
  ]);
});

test('Elite can switch models on the same endpoint before moving to another provider', async () => {
  const calls = [];
  const fetchImpl = async (endpoint, options) => {
    calls.push(JSON.parse(options.body).model);
    if (calls.length === 1) {
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        clone() { return this; },
        async json() { return { error: { code: 'insufficient_quota' } }; },
      };
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"model-fallback","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test model fallback', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    modelFallback: 'secondary-model-on-same-endpoint',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    fetchImpl,
  });

  assert.equal(result.summary, 'model-fallback');
  assert.deepEqual(calls, ['primary-model', 'secondary-model-on-same-endpoint']);
});

test('Elite fails closed when every configured provider is exhausted', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 429,
    headers: new Headers(),
    clone() { return this; },
    async json() { return { error: { code: 'insufficient_quota' } }; },
  });

  await assert.rejects(() => ask('test all providers exhausted', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    secondaryApiKey: 'secondary-test-token',
    secondaryEndpoint: 'https://secondary.invalid',
    secondaryModel: 'secondary-model',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    fetchImpl,
  }), /all_providers_exhausted:primary:provider_quota_exhausted,secondary:provider_quota_exhausted/);
});
