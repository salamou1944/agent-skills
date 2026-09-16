import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runEliteEngine } from './elite-engine.mjs';

const execFileAsync = promisify(execFile);
async function gitInit(root) {
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'elite-test@example.invalid'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Elite Test'], { cwd: root });
}

test('integrated Elite engine executes the full harness lifecycle with a provider double', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-'));
  await gitInit(root);
  const provider = async () => ({ summary: 'safe plan', changes: [{ path: 'feature.mjs', content: 'export const answer = 42;\n' }] });
  const result = await runEliteEngine('create a safe module', { root, provider, policy: { maxSteps: 12, maxRepairs: 1 } });
  assert.equal(result.status, 'verified');
  assert.ok(result.steps >= 6);
  assert.equal(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const answer = 42;\n');
});

test('engine entry point can verify a no-op task without a provider network call', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-import-'));
  await gitInit(root);
  const provider = async () => ({ summary: 'noop', changes: [] });
  const result = await runEliteEngine('confirm repository is safe', { root, provider });
  assert.equal(result.status, 'verified');
  assert.deepEqual(result.changedFiles, []);
});
