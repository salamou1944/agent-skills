import assert from 'node:assert/strict';
import test from 'node:test';
import { createSoldierRun, transitionSoldierRun, verifySoldierSystem } from './soldier-systems/army-14-systems.mjs';

function run() {
  return createSoldierRun({ soldierId: '01', taskId: 'adversarial', input: { goal: 'test' } });
}

test('ARMY-14 rejects illegal state transitions', () => {
  const r = run();
  assert.throws(() => transitionSoldierRun(r, 'completed', { kind: 'verification', ok: true }), /soldier_transition_invalid/);
  assert.throws(() => transitionSoldierRun(r, 'verifying', { kind: 'verification', ok: true }), /soldier_transition_invalid/);
});

test('ARMY-14 cannot complete without successful verification evidence', () => {
  let r = run();
  r = transitionSoldierRun(r, 'executing', { kind: 'action', ok: true });
  r = transitionSoldierRun(r, 'verifying', { kind: 'verification', ok: false });
  assert.throws(() => transitionSoldierRun(r, 'completed', { kind: 'result', ok: true, status: 'VERIFIED' }), /soldier_completion_verification_missing/);
  assert.equal(verifySoldierSystem(r), false);
});

test('ARMY-14 recovery path cannot silently become completed', () => {
  let r = run();
  r = transitionSoldierRun(r, 'executing', { kind: 'action', ok: true });
  r = transitionSoldierRun(r, 'recovering', { kind: 'result', ok: false, reason: 'provider-failure' });
  assert.throws(() => transitionSoldierRun(r, 'completed', { kind: 'result', ok: true, status: 'VERIFIED' }), /soldier_transition_invalid/);
  assert.equal(r.state, 'recovering');
});

test('ARMY-14 malformed evidence fails closed', () => {
  const r = run();
  assert.throws(() => transitionSoldierRun(r, 'executing', { ok: true }), /soldier_evidence_invalid/);
  assert.throws(() => transitionSoldierRun(r, 'executing', { kind: '' }), /soldier_evidence_invalid/);
});
