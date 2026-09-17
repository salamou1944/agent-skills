import assert from 'node:assert/strict';
import { army14SystemSnapshot, createSoldierRun, getSoldierSystem, transitionSoldierRun, verifySoldierSystem, SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

assert.equal(SOLDIER_SYSTEMS.length, 14);
assert.equal(new Set(SOLDIER_SYSTEMS.map((s) => s.id)).size, 14);

for (const soldier of SOLDIER_SYSTEMS) {
  assert.ok(soldier.contract);
  assert.ok(soldier.domain);
  assert.ok(soldier.loop);
  assert.deepEqual(soldier.requiredEvidence, ['input', 'action', 'verification']);
  assert.ok(soldier.recovery.includes('checkpoint'));
  assert.ok(soldier.recovery.includes('rollback-or-safe-stop'));

  const run = createSoldierRun({ soldierId: soldier.id, taskId: `system-test-${soldier.id}`, input: { fixture: true } });
  const executing = transitionSoldierRun(run, 'executing', { kind: 'action', ok: true });
  const verifying = transitionSoldierRun(executing, 'verifying', { kind: 'verification', ok: true });
  const completed = transitionSoldierRun(verifying, 'completed');
  assert.equal(completed.checkpoint, 'completed');
  assert.equal(verifySoldierSystem(completed), true);
  assert.equal(getSoldierSystem(soldier.id)?.id, soldier.id);
}

assert.throws(
  () => transitionSoldierRun(createSoldierRun({ soldierId: '01', taskId: 'negative', input: {} }), 'completed'),
  /soldier_completion_evidence_insufficient/,
);

const snapshot = army14SystemSnapshot();
assert.equal(snapshot.count, 14);
assert.equal(snapshot.soldiers.length, 14);
console.log(JSON.stringify({ ok: true, contract: snapshot.contract, soldierCount: snapshot.count, verifiedRuns: snapshot.count }));
