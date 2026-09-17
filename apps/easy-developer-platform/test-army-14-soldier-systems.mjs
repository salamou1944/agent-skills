import assert from 'node:assert/strict';
import { army14SystemSnapshot, createSoldierRun, getSoldierSystem, transitionSoldierRun, verifySoldierSystem, SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

const expectedIds = Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, '0'));
assert.deepEqual(SOLDIER_SYSTEMS.map((s) => s.id), expectedIds);
assert.equal(new Set(SOLDIER_SYSTEMS.map((s) => s.id)).size, 14);

for (const soldier of SOLDIER_SYSTEMS) {
  assert.equal(soldier.contract, 'army-14-soldier-system-v2');
  assert.ok(soldier.domain);
  assert.ok(soldier.loop);
  assert.equal(soldier.controls.length, 3);
  assert.deepEqual(soldier.requiredEvidence, ['input', 'action', 'verification']);
  assert.deepEqual(soldier.recovery, ['retry-safe', 'checkpoint', 'rollback-or-safe-stop']);
  assert.deepEqual(soldier.handoff, ['artifact', 'status', 'evidence', 'next_action']);
  assert.ok(soldier.invariants.includes('fail-closed'));
  assert.ok(soldier.invariants.includes('reproducible-verification'));

  const run = createSoldierRun({ soldierId: soldier.id, taskId: `system-test-${soldier.id}`, input: { fixture: true } });
  assert.equal(run.evidence[0].kind, 'input');
  const executing = transitionSoldierRun(run, 'executing', { kind: 'action', ok: true });
  const verifying = transitionSoldierRun(executing, 'verifying', { kind: 'verification', ok: true });
  const completed = transitionSoldierRun(verifying, 'completed');
  assert.equal(completed.checkpoint, 'completed');
  assert.equal(completed.nextAction, null);
  assert.equal(verifySoldierSystem(completed), true);
  assert.equal(getSoldierSystem(soldier.id)?.id, soldier.id);

  assert.throws(() => transitionSoldierRun(run, 'completed'), /soldier_transition_invalid/);
  assert.throws(() => transitionSoldierRun(run, 'executing', { bad: true }), /soldier_evidence_invalid/);
  const failedRun = createSoldierRun({ soldierId: soldier.id, taskId: `negative-${soldier.id}`, input: { fixture: true } });
  const failedExecuting = transitionSoldierRun(failedRun, 'executing', { kind: 'action', ok: true });
  const failedVerifying = transitionSoldierRun(failedExecuting, 'verifying', { kind: 'verification', ok: false });
  assert.throws(() => transitionSoldierRun(failedVerifying, 'completed'), /soldier_completion_verification_missing/);
}

const snapshot = army14SystemSnapshot();
assert.equal(snapshot.count, 14);
assert.equal(snapshot.soldiers.length, 14);
assert.equal(snapshot.contract, 'army-14-soldier-system-v2');
console.log(JSON.stringify({ ok: true, contract: snapshot.contract, soldierCount: snapshot.count, hardenedSystems: snapshot.count }));
