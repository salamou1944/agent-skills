import assert from 'node:assert/strict';
import test from 'node:test';
import { createSoldierRun, transitionSoldierRun, verifySoldierSystem, snapshotSoldierRun, restoreSoldierRun } from './soldier-systems/army-14-systems.mjs';

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
    () => transitionSoldierRun(winner, 'verifying', evidence(winner.runId, 'verify-stale', 'verification'), { expectedRevision: 0 }),
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


test('ARMY-14 recovery requires an explicit recovery transition and preserves evidence history', () => {
  let r = createSoldierRun({ soldierId: '05', taskId: 'recovery', input: { goal: 'test' } });
  r = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-1', 'action'), { expectedRevision: 0 });
  r = transitionSoldierRun(r, 'recovering', evidence(r.runId, 'recovery-1', 'recovery'), { expectedRevision: 1 });
  assert.equal(r.state, 'recovering');
  assert.equal(r.checkpoint, 'recovering');
  assert.equal(r.revision, 2);
  assert.equal(r.evidence.at(-1).evidenceId, 'recovery-1');
  const retried = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-2', 'action'), { expectedRevision: 2 });
  assert.equal(retried.revision, 3);
  assert.equal(retried.evidence.length, 4);
});

test('ARMY-14 completion cannot be forged by state/checkpoint alone', () => {
  const r = createSoldierRun({ soldierId: '06', taskId: 'completion', input: { goal: 'test' } });
  const forged = { ...r, state: 'completed', checkpoint: 'completed', revision: 1 };
  assert.equal(verifySoldierSystem(forged), false);
  assert.throws(() => transitionSoldierRun(r, 'completed', null, { expectedRevision: 0 }), /soldier_transition_invalid/);

  const validEvidence = [
    { kind: 'input', ok: true, runId: r.runId, evidenceId: 'input' },
    { kind: 'action', ok: true, runId: r.runId, evidenceId: 'action-forged' },
    { kind: 'verification', ok: true, runId: r.runId, evidenceId: 'verify-forged' },
  ];
  const forgedWithValidEvidence = { ...r, state: 'completed', checkpoint: 'completed', revision: 3, evidence: validEvidence };
  assert.equal(verifySoldierSystem(forgedWithValidEvidence), false);
});

test('ARMY-14 run snapshots survive restart and resume without losing identity or history', () => {
  let r = createSoldierRun({ soldierId: '07', taskId: 'restart', input: { goal: 'test' } });
  r = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-1', 'action'), { expectedRevision: 0 });
  r = transitionSoldierRun(r, 'recovering', evidence(r.runId, 'recovery-1', 'recovery'), { expectedRevision: 1 });
  const persisted = JSON.stringify(snapshotSoldierRun(r));
  const restored = restoreSoldierRun(persisted);
  assert.equal(restored.runId, r.runId);
  assert.equal(restored.revision, 2);
  assert.deepEqual(restored.history, r.history);
  const resumed = transitionSoldierRun(restored, 'executing', evidence(restored.runId, 'action-2', 'action'), { expectedRevision: 2 });
  assert.equal(resumed.revision, 3);
  assert.equal(resumed.state, 'executing');
});

test('ARMY-14 rejects corrupted restart snapshots and cross-run evidence', () => {
  let r = createSoldierRun({ soldierId: '08', taskId: 'restart-integrity', input: { goal: 'test' } });
  r = transitionSoldierRun(r, 'executing', evidence(r.runId, 'action-1', 'action'), { expectedRevision: 0 });
  const snapshot = snapshotSoldierRun(r);
  const forgedHistory = { ...snapshot, history: [{ ...snapshot.history[0], to: 'executing' }] };
  assert.throws(() => restoreSoldierRun(forgedHistory), /soldier_run_history_invalid/);
  const foreign = createSoldierRun({ soldierId: '08', taskId: 'foreign', input: { goal: 'foreign' } });
  assert.throws(() => restoreSoldierRun({ ...snapshot, evidence: [...snapshot.evidence, evidence(foreign.runId, 'foreign', 'action')] }), /soldier_evidence_run_mismatch/);
});
