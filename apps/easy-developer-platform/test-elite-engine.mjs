import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runEliteEngine } from './elite-engine.mjs';

const execFileAsync = promisify(execFile);
async function gitInit(root) {
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'elite-test@example.invalid'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Elite Test'], { cwd: root });
  await execFileAsync('git', ['commit', '--allow-empty', '-m', 'baseline'], { cwd: root });
}

function providerForPlan() {
  return async ({ role }) => role === 'reviewer' || role === 'correctness' || role === 'security' || role === 'regression' || role === 'final'
    ? { approved: true, findings: [], reason: 'deterministic test approval' }
    : { summary: 'safe plan', changes: [{ path: 'feature.mjs', content: 'export const answer = 42;\n' }] };
}

test('integrated Elite engine executes isolated lifecycle and promotes only verified changes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-'));
  await gitInit(root);
  const result = await runEliteEngine('create a safe module', { root, provider: providerForPlan(), policy: { maxSteps: 12, maxRepairs: 1 } });
  assert.equal(result.status, 'TASK_VERIFIED');
  assert.equal(result.isolated, true);
  assert.ok(result.steps >= 6);
  assert.equal(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const answer = 42;\n');
});

test('engine entry point verifies a no-op task without a provider network call', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-import-'));
  await gitInit(root);
  const provider = async ({ role }) => role === 'reviewer' || role === 'correctness' || role === 'security' || role === 'regression' || role === 'final' ? { approved: true } : { summary: 'noop', changes: [] };
  const result = await runEliteEngine('confirm repository is safe', { root, provider });
  assert.equal(result.status, 'TASK_VERIFIED');
  assert.deepEqual(result.changedFiles, []);
});

test('engine fails closed when the base workspace is dirty', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-engine-dirty-'));
  await gitInit(root);
  await writeFile(join(root, 'dirty.mjs'), 'export const dirty = true;\n');
  await assert.rejects(() => runEliteEngine('do work', { root, provider: providerForPlan() }), error => error.code === 'workspace_dirty');
});
