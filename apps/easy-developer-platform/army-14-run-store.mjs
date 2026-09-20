import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { restoreSoldierRun, snapshotSoldierRun } from './soldier-systems/army-14-systems.mjs';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
function assertRunId(runId) {
  if (typeof runId !== 'string' || !SAFE_ID.test(runId) || runId.includes('..')) throw new Error('army14_run_id_invalid');
}
export function createRunStore(root, runId) {
  assertRunId(runId);
  const dir = join(root, '.elite', 'army-14', 'state');
  const file = join(dir, `${runId}.json`);
  const lock = `${file}.lock`;
  async function save(run) {
    assertRunId(run.runId);
    if (run.runId !== runId) throw new Error('army14_run_identity_mismatch');
    const payload = JSON.stringify(snapshotSoldierRun(run));
    await mkdir(dir, { recursive: true });
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, payload, { encoding: 'utf8', flag: 'wx' });
    await rename(tmp, file);
    return run;
  }
  async function load() {
    try { return restoreSoldierRun(await readFile(file, 'utf8')); }
    catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
  }
  async function acquireLock({ staleMs = 30_000, retryMs = 10, timeoutMs = 2_000 } = {}) {
    const started = Date.now();
    await mkdir(dir, { recursive: true });
    while (true) {
      try {
        await mkdir(lock);
        await writeFile(join(lock, 'owner'), JSON.stringify({ pid: process.pid, startedAt: Date.now() }), { flag: 'wx' });
        return async () => { await rm(lock, { recursive: true, force: true }); };
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        const age = await stat(lock).then(s => Date.now() - s.mtimeMs).catch(() => 0);
        if (age > staleMs) { await rm(lock, { recursive: true, force: true }).catch(() => {}); continue; }
        if (Date.now() - started >= timeoutMs) throw new Error('army14_state_lock_timeout');
        await new Promise(resolve => setTimeout(resolve, retryMs));
      }
    }
  }
  return { file, lock, save, load, acquireLock };
}
