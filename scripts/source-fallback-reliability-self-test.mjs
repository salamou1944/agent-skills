#!/usr/bin/env node

import assert from 'node:assert/strict';
import { ReliabilityError, ReliableSourceRouter, SourceHealthRegistry } from './lib/source-fallback-reliability.mjs';

const noWait = async () => {};
const policy = {
  timeoutMs: 25,
  maxAttemptsPerSource: 2,
  backoffMs: 0,
  jitterMs: 0,
  sleepFn: noWait,
};

async function run() {
  {
    let fallbackCalls = 0;
    const router = new ReliableSourceRouter({
      ...policy,
      sources: [
        { id: 'primary', priority: 0, fetch: async () => 'primary' },
        { id: 'fallback', priority: 1, fetch: async () => { fallbackCalls += 1; return 'fallback'; } },
      ],
      validate: (value) => value === 'primary' || value === 'fallback',
    });
    const result = await router.execute({ operation: 'primary-success' });
    assert.equal(result.value, 'primary');
    assert.equal(result.report.fallbackUsed, false);
    assert.equal(fallbackCalls, 0);
  }

  {
    const router = new ReliableSourceRouter({
      ...policy,
      sources: [
        { id: 'primary', priority: 0, fetch: async () => { throw new Error('primary-down'); } },
        { id: 'fallback', priority: 1, fetch: async () => 'fallback-ok' },
      ],
      validate: (value) => value === 'fallback-ok',
    });
    const result = await router.execute({ operation: 'fallback-success' });
    assert.equal(result.value, 'fallback-ok');
    assert.equal(result.sourceId, 'fallback');
    assert.equal(result.report.fallbackUsed, true);
    assert.equal(result.report.failures.length, 2);
  }

  {
    let fallbackCalls = 0;
    const router = new ReliableSourceRouter({
      ...policy,
      sources: [
        { id: 'primary', priority: 0, fetch: async () => 'untrusted' },
        { id: 'fallback', priority: 1, fetch: async () => { fallbackCalls += 1; return 'trusted'; } },
      ],
      validate: (value) => value === 'trusted',
    });
    const result = await router.execute({ operation: 'validation-gate' });
    assert.equal(result.value, 'trusted');
    assert.equal(fallbackCalls, 1);
    assert.equal(result.report.failures[0].kind, 'invalid');
  }

  {
    const router = new ReliableSourceRouter({
      ...policy,
      sources: [
        { id: 'primary', priority: 0, fetch: () => new Promise(() => {}) },
        { id: 'fallback', priority: 1, fetch: async () => 'timeout-recovered' },
      ],
      validate: (value) => value === 'timeout-recovered',
    });
    const result = await router.execute({ operation: 'timeout' });
    assert.equal(result.value, 'timeout-recovered');
    assert.equal(result.report.failures.some((failure) => failure.kind === 'timeout'), true);
  }

  {
    const health = new SourceHealthRegistry({ failureThreshold: 1, cooldownMs: 60_000 });
    let primaryCalls = 0;
    const router = new ReliableSourceRouter({
      ...policy,
      health,
      sources: [
        { id: 'primary', priority: 0, fetch: async () => { primaryCalls += 1; throw new Error('down'); } },
        { id: 'fallback', priority: 1, fetch: async () => 'ok' },
      ],
      validate: (value) => value === 'ok',
    });
    await router.execute({ operation: 'cooldown-1' });
    await router.execute({ operation: 'cooldown-2' });
    assert.equal(primaryCalls, 2); // two attempts in the first request; skipped on the second request
  }

  {
    const router = new ReliableSourceRouter({
      ...policy,
      sources: [
        { id: 'primary', priority: 0, fetch: async () => { throw new Error('down'); } },
        { id: 'fallback', priority: 1, fetch: async () => { throw new Error('also-down'); } },
      ],
      validate: () => true,
    });
    await assert.rejects(
      router.execute({ operation: 'total-failure' }),
      (error) => error instanceof ReliabilityError && error.report.attempts === 4 && error.report.failures.length === 4,
    );
  }

  console.log(JSON.stringify({ ok: true, suite: 'source-fallback-reliability' }, null, 2));
}

await run();
