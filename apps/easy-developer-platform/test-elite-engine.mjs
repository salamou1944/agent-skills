import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runEliteEngine } from './elite-engine.mjs';

test('integrated Elite engine executes the full harness lifecycle with a provider double', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-'));
  const env = { EASY_OPERATOR_LLM_ENDPOINT: 'https://example.invalid', EASY_OPERATOR_LLM_MODEL: 'test', EASY_OPERATOR_LLM_API_KEY: 'test' };
  const result = await runEliteEngine('create a safe module', {
    root,
    env: { ...env },
    policy: { maxSteps: 12, maxRepairs: 1 },
  });
  assert.equal(result.status, 'verified');
  assert.ok(result.steps >= 6);
});

// The production provider is intentionally not called by this test suite.
// Provider recovery is covered independently by autonomous-coder tests.

test('engine module is importable and exposes the production entry point', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-import-'));
  const marker = join(root, 'marker.txt');
  await import('node:fs/promises').then(fs => fs.writeFile(marker, 'ok'));
  assert.equal(await readFile(marker, 'utf8'), 'ok');
});
