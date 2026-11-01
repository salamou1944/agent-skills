import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectEvidence } from './scripts/army-14-evidence-provider.mjs';

const context = {
  runId: '12345', runAttempt: '1', repository: 'owner/repo',
  ref: 'refs/heads/army/test', sha: 'a'.repeat(40),
  workflow: 'manual-evidence-harness', eventName: 'workflow_dispatch',
};

async function fixture(envelopeOverrides = {}, results = { checks: [] }) {
  const dir = await mkdtemp(join(tmpdir(), 'army14-evidence-'));
  const envelopePath = join(dir, 'envelope.json');
  const resultsPath = join(dir, 'results.json');
  const outputPath = join(dir, 'bundle.json');
  await writeFile(envelopePath, JSON.stringify({
    runId: context.runId, runAttempt: context.runAttempt,
    repository: context.repository, ref: context.ref, sha: context.sha,
    eventName: context.eventName, ...envelopeOverrides,
  }));
  await writeFile(resultsPath, JSON.stringify(results));
  return { dir, envelopePath, resultsPath, outputPath };
}

test('mismatched run binding is blocked', async () => {
  const f = await fixture({ runId: 'other' });
  try {
    const bundle = await collectEvidence({ ...f, context });
    assert.equal(bundle.status, 'BLOCKED');
    assert.equal(bundle.verified, false);
    assert.ok(bundle.reason.some((x) => x.includes('runId mismatch')));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('empty acceptance checks are blocked', async () => {
  const f = await fixture();
  try {
    const bundle = await collectEvidence({ ...f, context });
    assert.equal(bundle.status, 'BLOCKED');
    assert.ok(bundle.reason.some((x) => x.includes('no task-specific acceptance checks')));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('successful-looking fixture cannot bypass independent provenance gate', async () => {
  const f = await fixture({}, { checks: [{ name: 'example', exitCode: 0, trusted: true }] });
  try {
    const bundle = await collectEvidence({ ...f, context });
    assert.equal(bundle.status, 'BLOCKED');
    assert.equal(bundle.verified, false);
    assert.ok(bundle.reason.some((x) => x.includes('attestation verification')));
    const persisted = JSON.parse(await readFile(f.outputPath, 'utf8'));
    assert.equal(persisted.status, 'BLOCKED');
    assert.equal(persisted.verified, false);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('output cannot be silently overwritten', async () => {
  const f = await fixture();
  try {
    await writeFile(f.outputPath, 'preexisting');
    await assert.rejects(collectEvidence({ ...f, context }));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
