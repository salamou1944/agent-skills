import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJournal, createPolicy, assertSafePath, runEliteTask, eliteHarnessVersion, EliteHarnessError } from './elite-harness.mjs';

test('harness exposes bounded policy and protected-path enforcement', () => {
  const policy = createPolicy({ maxSteps: 3, maxRepairs: 2 });
  assert.equal(policy.maxSteps, 3);
  assert.equal(policy.maxRepairs, 2);
  assert.throws(() => assertSafePath('/tmp/work', '.env', policy.forbidden), EliteHarnessError);
  assert.throws(() => assertSafePath('/tmp/work', '.github/workflows/x.yml', policy.forbidden), EliteHarnessError);
  assert.throws(() => assertSafePath('/tmp/work', '../escape.js', policy.forbidden), EliteHarnessError);
  assert.equal(eliteHarnessVersion, '2.0.0');
});

test('harness completes only after implementation, tests, review, and verification', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-harness-'));
  const journalPath = join(root, '.elite', 'journal.ndjson');
  const calls = [];
  const result = await runEliteTask('add a safe feature', {
    root,
    journalPath,
    provider: async (prompt) => { calls.push(prompt.role); return { summary: 'plan', changes: [{ path: 'feature.mjs', content: 'export const answer = 42;\n' }] }; },
    inspect: async () => ({ context: 'feature.mjs is absent' }),
    execute: async ({ changes }) => { await writeFile(changes[0].target, changes[0].content); return { ok: true }; },
    test: async () => ({ ok: true, summary: 'focused tests passed' }),
    review: async () => ({ ok: true, summary: 'adversarial review passed' }),
    verify: async () => ({ ok: true, summary: 'integration verification passed', evidence: 'verified-test-double' }),
  });
  assert.equal(result.status, 'TASK_VERIFIED');
  assert.deepEqual(calls, ['planner']);
  assert.deepEqual(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const answer = 42;\n');
  const journal = await readFile(journalPath, 'utf8');
  for (const phase of ['inspect', 'plan', 'implement', 'test', 'review', 'verify', 'complete']) assert.match(journal, new RegExp(`"type":"${phase}"`));
});

test('failed verification rolls back before bounded repair and then succeeds', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-repair-'));
  let plans = 0;
  let verifies = 0;
  const result = await runEliteTask('repair feature', {
    root,
    policy: { maxRepairs: 1 },
    provider: async ({ role }) => {
      plans += 1;
      if (role === 'repair') return { summary: 'repaired', changes: [{ path: 'feature.mjs', content: 'export const ok = true;\n' }] };
      return { summary: 'bad first plan', changes: [{ path: 'feature.mjs', content: 'not valid javascript' }] };
    },
    inspect: async () => ({ context: 'broken feature' }),
    execute: async ({ changes }) => { await writeFile(changes[0].target, changes[0].content); return { ok: true }; },
    test: async () => ({ ok: true }),
    review: async () => ({ ok: true }),
    verify: async ({ changes }) => { verifies += 1; if (verifies === 1) return { ok: false, reason: 'verification caught defect' }; return { ok: true, evidence: 'repaired-and-verified' }; },
  });
  assert.equal(result.status, 'verified');
  assert.equal(result.repairs, 1);
  assert.equal(plans, 2);
  assert.equal(verifies, 2);
  assert.deepEqual(await readFile(join(root, 'feature.mjs'), 'utf8'), 'export const ok = true;\n');
});

test('journal records failure when repair budget is exhausted', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-fail-'));
  const journalPath = join(root, '.elite', 'journal.ndjson');
  await assert.rejects(() => runEliteTask('fail safely', {
    root, journalPath, policy: { maxRepairs: 0 },
    provider: async () => ({ changes: [{ path: 'x.mjs', content: 'x' }] }),
    inspect: async () => ({ context: '' }),
    execute: async ({ changes }) => { await writeFile(changes[0].target, changes[0].content); },
    test: async () => ({ ok: false, reason: 'intentional failure' }),
    review: async () => ({ ok: true }), verify: async () => ({ ok: true }),
  }), /intentional failure/);
  const journal = await readFile(journalPath, 'utf8');
  assert.match(journal, /"type":"failure"/);
});
