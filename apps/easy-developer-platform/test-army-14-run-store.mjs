import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createSoldierRun, transitionSoldierRun } from './soldier-systems/army-14-systems.mjs';
import { createRunStore } from './army-14-run-store.mjs';

const ev = (runId, evidenceId, kind, ok = true) => ({ runId, evidenceId, kind, ok });

test('durable run store atomically persists and restores a resumable run', async () => {
  const root = await mkdtemp(join(tmpdir(), 'army14-store-'));
  try {
    const store = createRunStore(root, '01:crash-resume');
    let run = createSoldierRun({ soldierId: '01', taskId: 'crash-resume', input: { goal: 'restart' } });
    run = transitionSoldierRun(run, 'executing', ev(run.runId, 'a1', 'action'), { expectedRevision: 0 });
    await store.save(run);
    const restored = await store.load();
    assert.deepEqual(restored.history, run.history);
    const resumed = transitionSoldierRun(restored, 'recovering', ev(restored.runId, 'r1', 'recovery'), { expectedRevision: 1 });
    await store.save(resumed);
    assert.equal((await store.load()).revision, 2);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('store rejects cross-run writes and corrupted persisted state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'army14-store-'));
  try {
    const store = createRunStore(root, '02:run-a');
    const foreign = createSoldierRun({ soldierId: '02', taskId: 'run-b', input: { goal: 'foreign' } });
    await assert.rejects(() => store.save(foreign), /army14_run_identity_mismatch/);
    let local = createSoldierRun({ soldierId: '02', taskId: 'run-a', input: { goal: 'local' } });
    local = transitionSoldierRun(local, 'executing', ev(local.runId, 'a1', 'action'), { expectedRevision: 0 });
    await store.save(local);
    const fs = await import('node:fs/promises');
    await fs.writeFile(store.file, JSON.stringify({ ...local, history: [{ ...local.history[0], to: 'executing' }] }));
    await assert.rejects(() => store.load(), /soldier_run_history_invalid/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('stale lock can be recovered but fresh lock fails closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'army14-store-'));
  try {
    const store = createRunStore(root, 'lock-test');
    const release = await store.acquireLock({ timeoutMs: 100 });
    await assert.rejects(() => store.acquireLock({ timeoutMs: 40, retryMs: 5, staleMs: 10_000 }), /army14_state_lock_timeout/);
    await release();
    const release2 = await store.acquireLock({ timeoutMs: 100 });
    await release2();
    const release3 = await store.acquireLock({ timeoutMs: 100 });
    const old = new Date(Date.now() - 60_000);
    await utimes(store.lock, old, old);
    const recovered = await store.acquireLock({ timeoutMs: 100, retryMs: 5, staleMs: 1_000 });
    assert.equal(typeof recovered, 'function');
    await recovered();
    await release3();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('two OS processes cannot concurrently own the same run lock', async () => {
  const root = await mkdtemp(join(tmpdir(), 'army14-process-lock-'));
  try {
    const script = "import { createRunStore } from './apps/easy-developer-platform/army-14-run-store.mjs'; const s=createRunStore(process.argv[1], 'shared'); s.acquireLock({timeoutMs:200,retryMs:10,staleMs:60000}).then(async release=>{console.log('ACQUIRED'); await new Promise(r=>setTimeout(r,1000)); await release();}).catch(e=>{console.error(e.message); process.exitCode=2;});";
    const first = spawn(process.execPath, ['--input-type=module', '-e', script, root], { stdio: ['ignore','pipe','pipe'] });
    await new Promise((resolve, reject) => { let out=''; const t=setTimeout(()=>reject(new Error('child_lock_timeout')),2000); first.stdout.on('data',d=>{out+=d;if(out.includes('ACQUIRED')){clearTimeout(t);resolve();}}); first.on('error',reject); });
    const second = spawn(process.execPath, ['--input-type=module', '-e', script, root], { stdio: ['ignore','pipe','pipe'] });
    const secondResult = await new Promise(resolve => { let out=''; let err=''; second.stdout.on('data',d=>out+=d); second.stderr.on('data',d=>err+=d); second.on('close',(code)=>resolve({code,out,err})); });
    assert.equal(secondResult.code, 2);
    assert.match(secondResult.err, /army14_state_lock_timeout/);
    await new Promise(resolve => first.on('close', resolve));
  } finally { await rm(root, { recursive: true, force: true }); }
});


test('practical runner resumes a real persisted soldier after process crash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'army14-runner-restart-'));
  try {
    const clone = join(root, 'repo');
    const cloneResult = await new Promise(resolve => {
      const child = spawn('git', ['clone', '--no-hardlinks', process.cwd(), clone], { stdio: ['ignore','pipe','pipe'] });
      let stderr=''; child.stderr.on('data', d => stderr += d); child.on('close', code => resolve({ code, stderr })); child.on('error', error => resolve({ code: null, stderr: error.message }));
    });
    assert.equal(cloneResult.code, 0, cloneResult.stderr);
    const runId = 'crash-restart-integration';
    const first = await new Promise(resolve => {
      const child = spawn(process.execPath, ['apps/easy-developer-platform/army-14-practical-runner.mjs', 'restart integration'], { cwd: clone, env: { ...process.env, ARMY14_CRASH_AFTER_STATE: 'executing', ARMY_WORKSPACE: clone }, stdio: ['ignore','pipe','pipe'] });
      let stdout='', stderr=''; child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d); child.on('close', code => resolve({ code, stdout, stderr })); child.on('error', error => resolve({ code: null, stdout, stderr: error.message }));
    });
    assert.equal(first.code, 86, first.stderr || first.stdout);
    const persisted = createRunStore(clone, '01:army14-unknown');
    const stateRoot = join(clone, '.elite', 'army-14', 'state');
    const stateFiles = await import('node:fs/promises').then(fs => fs.readdir(stateRoot));
    assert.ok(stateFiles.some(name => name.endsWith('.json')));
    const second = await new Promise(resolve => {
      const child = spawn(process.execPath, ['apps/easy-developer-platform/army-14-practical-runner.mjs', 'restart integration'], { cwd: clone, env: { ...process.env, ARMY_WORKSPACE: clone, ARMY14_CRASH_AFTER_STATE: '' }, stdio: ['ignore','pipe','pipe'] });
      let stdout='', stderr=''; child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d); child.on('close', code => resolve({ code, stdout, stderr })); child.on('error', error => resolve({ code: null, stdout, stderr: error.message }));
    });
    assert.equal(second.code, 0, second.stderr || second.stdout);
    assert.match(second.stdout, /PIPELINE_VERIFIED/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
