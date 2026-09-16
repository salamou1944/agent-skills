import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runEliteEngine } from './elite-engine.mjs';

test('integrated Elite engine executes the full harness lifecycle with a provider double', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-'));
  const provider = async ({ role }) => ({ summary: role === 'repair' ? 'repair plan' : 'safe plan', changes: [{ path: 'feature.mjs', content: 'export const answer = 42;\n' }] });
  const result = await runEliteEngine('create a safe module', { root, provider, policy: { maxSteps: 12, maxRepairs: 1 } });
  assert.equal(result.status, 'verified');
  assert.ok(result.steps >= 6);
  assert.equal(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const answer = 42;\n');
});

test('engine module exposes a callable production entry point', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-import-'));
  const provider = async () => ({ summary: 'noop', changes: [] });
  const result = await runEliteEngine('confirm repository is safe', { root, provider });
  assert.equal(result.status, 'verified');
});
