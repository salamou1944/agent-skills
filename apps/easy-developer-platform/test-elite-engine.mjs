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

test('Elite planner consumes a documented verified invocation result as cycle evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-invocation-result-'));
  await gitInit(root);
  let plannerContext = '';
  const invocationResult = {
    taskId: 'operator-invocation-42',
    state: 'EVIDENCE_CAPTURED',
    verification: { verifierId: 'ollama-independent-verifier-v1', passed: true, errors: [] },
    evidence: [
      { kind: 'action', adapter: 'ai.local.ollama', status: 200 },
      { kind: 'verification', verifierId: 'ollama-independent-verifier-v1', passed: true },
      { kind: 'independent_verification', verifierId: 'ollama-independent-verifier-v1', passed: true }
    ],
    result: { result: { ok: true, data: { finding: 'missing null guard' } } },
    completion: { ok: true }
  };
  const provider = async ({ role, context }) => {
    if (role === 'planner') {
      plannerContext = context;
      return { summary: 'use documented invocation finding', changes: [{ path: 'feature.mjs', content: 'export const finding = "missing null guard";\n' }] };
    }
    return role === 'reviewer' || role === 'correctness' || role === 'security' || role === 'regression' || role === 'final'
      ? { approved: true, findings: [], reason: 'deterministic test approval' }
      : { summary: 'noop', changes: [] };
  };
  const result = await runEliteEngine('apply the documented capability finding', {
    root, provider, capabilityInvocationResult: invocationResult, policy: { maxSteps: 12, maxRepairs: 1 }
  });
  assert.equal(result.status, 'TASK_VERIFIED');
  assert.match(plannerContext, /operator-invocation-42/);
  assert.match(plannerContext, /missing null guard/);
  assert.match(plannerContext, /ollama-independent-verifier-v1/);
  assert.equal(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const finding = "missing null guard";\n');
});

test('Elite rejects undocumented or unverified invocation results', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-invalid-invocation-result-'));
  await gitInit(root);
  const invalid = {
    taskId: 'operator-invocation-invalid',
    state: 'EVIDENCE_CAPTURED',
    verification: { verifierId: 'test', passed: false, errors: ['failed'] },
    evidence: [{ kind: 'action', adapter: 'ai.local.ollama' }],
    completion: { ok: false }
  };
  await assert.rejects(
    () => runEliteEngine('do not use invalid invocation evidence', { root, provider: providerForPlan(), capabilityInvocationResult: invalid }),
    error => error.code === 'invalid_capability_invocation_result'
  );
});
