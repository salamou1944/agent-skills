import assert from 'node:assert/strict';
import test from 'node:test';
import { createSoldierRun, transitionSoldierRun, verifySoldierSystem } from './soldier-systems/army-14-systems.mjs';

const evidence = (runId, evidenceId, kind, ok = true) => ({ runId, evidenceId, kind, ok });

test('ARMY-14 lifecycle binds evidence to run identity and advances revisions', () => {
  let r = createSoldierRun({ soldierId: '01', taskId: 'lifecycle', input: { goal: 'test' } });
  assert.equal(r.revision, 0);
  r = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-1', 'action'), { expectedRevision: 0 });
  r = transitionSoldierRun(r, 'verifying', evidence(r.runId, 'verify-1', 'verification'), { expectedRevision: 1 });
  r = transitionSoldierRun(r, 'completed', null, { expectedRevision: 2 });
  assert.equal(r.revision, 3);
  assert.equal(verifySoldierSystem(r), true);
});

test('ARMY-14 rejects stale concurrent transitions', () => {
  const base = createSoldierRun({ soldierId: '02', taskId: 'concurrency', input: { goal: 'test' } });
  const winner = transitionSoldierRun(base, 'executing', evidence(base.runId, 'action-a', 'action'), { expectedRevision: 0 });
  assert.throws(
    () => transitionSoldierRun(base, 'executing', evidence(base.runId, 'action-b', 'action'), { expectedRevision: 0 }),
    /soldier_revision_conflict/
  );
  assert.equal(winner.revision, 1);
});

test('ARMY-14 rejects stale, forged, and duplicate evidence', () => {
  let r = createSoldierRun({ soldierId: '03', taskId: 'evidence', input: { goal: 'test' } });
  const foreign = createSoldierRun({ soldierId: '03', taskId: 'other', input: { goal: 'other' } });
  assert.throws(
    () => transitionSoldierRun(r, 'executing', evidence(foreign.runId, 'foreign-action', 'action'), { expectedRevision: 0 }),
    /soldier_evidence_run_mismatch/
  );
  r = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-1', 'action'), { expectedRevision: 0 });
  assert.throws(
    () => transitionSoldierRun(r, 'verifying', evidence(r.runId, 'action-1', 'verification'), { expectedRevision: 1 }),
    /soldier_evidence_duplicate/
  );
  assert.throws(
    () => transitionSoldierRun(r, 'verifying', evidence(r.runId, 'verify-1', 'verification'), { expectedRevision: 0 }),
    /soldier_revision_conflict/
  );
});

test('ARMY-14 verification ignores mismatched evidence even when state is forged', () => {
  const r = createSoldierRun({ soldierId: '04', taskId: 'tamper', input: { goal: 'test' } });
  const forged = {
    ...r,
    state: 'completed',
    checkpoint: 'completed',
    revision: 3,
    evidence: [
      ...r.evidence,
      { runId: '04:other', evidenceId: 'action-x', kind: 'action', ok: true },
      { runId: '04:other', evidenceId: 'verify-x', kind: 'verification', ok: true },
    ],
  };
  assert.equal(verifySoldierSystem(forged), false);
});
