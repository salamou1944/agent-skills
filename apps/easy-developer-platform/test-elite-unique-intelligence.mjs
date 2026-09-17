import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  generateCounterfactuals, chooseCounterfactual, immuneSignature, immuneGate, recordAttempt, readAttemptLedger,
  adversarialProbe, evolutionEvent, projectScope, crossProjectSignal, stopAndExplain, integritySummary
} from './elite-unique-intelligence.mjs';

test('counterfactual engine emits independent hypotheses and a constraint-bound selection', () => {
  const candidates = generateCounterfactuals({ goal: 'fix parser', context: 'json input', constraints: {} });
  assert.equal(candidates.length, 4);
  assert.equal(new Set(candidates.map(x => x.hypothesisHash)).size, 4);
  const selected = chooseCounterfactual({ candidates, constraints: { requiredMode: 'defensive' } });
  assert.equal(selected.ok, true);
  assert.equal(selected.selected.id, 'defensive');
});

test('code immune system blocks a known failure signature but allows a different strategy', () => {
  const signature = immuneSignature({ failureCode: 'test_failed', failureMessage: 'bad', changedFiles: ['a.mjs'], strategy: 'old' });
  assert.equal(immuneGate({ knownFailures: [{ signature }], failureCode: 'test_failed', failureMessage: 'bad', changedFiles: ['a.mjs'], strategy: 'old' }).ok, false);
  assert.equal(immuneGate({ knownFailures: [{ signature }], failureCode: 'test_failed', failureMessage: 'bad', changedFiles: ['a.mjs'], strategy: 'new' }).ok, true);
});

test('persisted failure ledger is sufficient for immune rejection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'elite-immune-'));
  try {
    const path = join(dir, 'attempts.jsonl');
    await recordAttempt(path, { goal: 'fix parser', plan: { summary: 'old', changes: [{ path: 'a.mjs' }] }, failureCode: 'test_failed', failureMessage: 'bad', strategy: 'old', changedFiles: ['a.mjs'] });
    const ledger = await readAttemptLedger(path);
    const blocked = immuneGate({ knownFailures: ledger, failureCode: 'test_failed', failureMessage: 'bad', changedFiles: ['a.mjs'], strategy: 'old' });
    const allowed = immuneGate({ knownFailures: ledger, failureCode: 'test_failed', failureMessage: 'bad', changedFiles: ['a.mjs'], strategy: 'new' });
    assert.equal(blocked.ok, false);
    assert.equal(allowed.ok, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('adversarial engineering identifies blocking hazards', () => {
  const result = adversarialProbe({ goal: 'secure change', changes: [{ path: 'a.mjs', content: 'const apiKey = "hard-coded";' }] });
  assert.equal(result.ok, false);
  assert.ok(result.blocking.some(x => x.rule === 'embedded_secret'));
});

test('evolution graph and cross-project scopes remain explicit', () => {
  const event = evolutionEvent({ taskId: 't1', goal: 'x', status: 'verified', changedFiles: ['a.mjs'], proofHash: 'p' });
  assert.equal(event.event, 'task_verified');
  assert.equal(projectScope('mony').scope, 'project:mony');
  assert.equal(projectScope('easy', { shared: true }).scope, 'shared');
  assert.equal(crossProjectSignal({ project: 'easy', kind: 'pattern', value: 'x' }).scope, 'project:easy');
});

test('stop-and-explain blocks incomplete evidence', () => {
  const blocked = stopAndExplain({ result: { status: 'failed' }, proof: null, verification: { ok: false } });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.reasons.includes('verification_failed'));
  assert.equal(stopAndExplain({ result: { status: 'verified' }, proof: { proofHash: 'x' }, verification: { ok: true } }).ok, true);
  assert.equal(integritySummary({ counterfactual: [], immune: { signature: 'x' }, adversarial: { challengeHash: 'y' }, evolution: eventForTest(), crossProject: { scope: 'shared' } }).version, 1);
});

function eventForTest() { return { event: 'task_verified' }; }
