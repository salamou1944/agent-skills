import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { REQUIRED_ROLES, manifestPath, roleSlug, validateManifest, validateRoleSet, validateWorkerResult } from './scripts/army-14-manifest.mjs';

const runId = '123456789';
const runAttempt = '2';
const commit = 'a'.repeat(40);
const branch = `army/${runId}/architect`;
const testEvidence = [{ command: 'npm test', passed: true }];

async function proofFixture(t, patch = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'army-14-evidence-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = Buffer.from('fixture-only output; not independent proof\n');
  await writeFile(join(dir, 'check-output.txt'), output);
  const proof = {
    schema: 'army-14-independent-task-evidence/v1', status: 'PASS',
    runId, runAttempt, role: 'Architect', branch, commit,
    checks: [{ command: 'fixture verification', taskSpecific: true, passed: true,
      outputPath: 'check-output.txt', outputSha256: createHash('sha256').update(output).digest('hex') }],
    ...patch,
  };
  const proofPath = join(dir, 'proof.json');
  await writeFile(proofPath, JSON.stringify(proof));
  return { dir, proofPath, proof };
}

function workerResult(overrides = {}) {
  return { status: 'VERIFIED', taskVerified: true, pipelineVerified: true,
    changedFiles: ['src/fix.mjs'], providerTelemetry: [], ...overrides };
}

function manifest(role, overrides = {}) {
  return {
    schema: 'army-14-worker-manifest/v1', status: 'VERIFIED', runId, runAttempt, role,
    branch: `army/${runId}/${roleSlug(role)}`, commit, taskVerified: true,
    pipelineVerified: true, fallbackUsed: false, blocked: false, incomplete: false,
    quotaExhausted: false, changedFiles: ['src/fix.mjs'], tests: testEvidence,
    independentEvidence: { schema: 'army-14-independent-task-evidence/v1', status: 'PASS', runId, role,
      runAttempt, branch: `army/${runId}/${roleSlug(role)}`, commit,
      checks: [{ command: 'fixture verification', taskSpecific: true, passed: true,
        outputPath: 'check-output.txt', outputSha256: 'b'.repeat(64) }] },
    createdAt: '2026-10-31T00:00:00.000Z', ...overrides,
  };
}
function records() {
  return REQUIRED_ROLES.map(role => ({ manifest: manifest(role), branch: `army/${runId}/${roleSlug(role)}`, tip: commit }));
}

test('role slugs normalize all 14 role branches uniquely', () => {
  const slugs = REQUIRED_ROLES.map(roleSlug);
  assert.equal(REQUIRED_ROLES.length, 14);
  assert.equal(new Set(slugs).size, 14);
  assert.equal(roleSlug('UI-UX'), 'ui-ux');
  assert.equal(roleSlug('Backend/API'), 'backend-api');
});

test('producer/consumer path helper agrees for every required role', async () => {
  const producer = await readFile('.github/workflows/elite-code-reusable-supervisor.yml', 'utf8');
  const consumer = await readFile('../Easy-review/.github/workflows/army-14-practical-easy-gate.yml', 'utf8').catch(() => '');
  assert.match(producer, /manifest-path --run-id/);
  assert.match(producer, /--output "\$MANIFEST_PATH"/);
  if (consumer) assert.match(consumer, /manifest-path --run-id/);
  for (const role of REQUIRED_ROLES) {
    const expected = `.army-14/manifests/${runId}/${roleSlug(role)}.json`;
    const produced = execFileSync(process.execPath, ['./scripts/army-14-manifest.mjs', 'manifest-path', '--run-id', runId, '--role', role], { encoding: 'utf8' });
    const consumed = execFileSync(process.execPath, ['./scripts/army-14-manifest.mjs', 'manifest-path', '--run-id', runId, '--role', role], { encoding: 'utf8' });
    assert.equal(manifestPath(runId, role), expected);
    assert.equal(produced, expected);
    assert.equal(consumed, expected);
  }
});

test('normalizes path case but rejects wrong-case and unknown role identities', () => {
  const canonical = manifest('Architect');
  assert.equal(manifestPath(runId, 'ARCHITECT'), manifestPath(runId, 'Architect'));
  assert.equal(validateManifest(canonical, { runId, runAttempt, role: 'Architect', branch, commit }).ok, false);
  assert.equal(validateManifest({ ...canonical, role: 'architect' }, { runId, runAttempt, role: 'Architect', branch, commit }).ok, false);
  assert.equal(validateManifest({ ...canonical, role: 'ARCHITECT' }, { runId, runAttempt, role: 'Architect', branch, commit }).ok, false);
  assert.equal(validateManifest(canonical, { runId, runAttempt, role: 'architect', branch, commit }).ok, false);
  assert.equal(validateManifest(manifest('Unknown'), { runId, runAttempt, role: 'Unknown', branch, commit }).ok, false);
});

test('even a complete 14-role fixture cannot be promoted without a trusted evidence provider', () => {
  const result = validateRoleSet(records(), { runId, runAttempt });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('independent_evidence_provider_unavailable')));
});

test('every explicit worker failure flag blocks result verification', async t => {
  const { proof, proofPath } = await proofFixture(t);
  const validShape = workerResult();
  assert.equal(validateWorkerResult(validShape, proof, { runId, runAttempt, role: 'Architect', branch, commit, proofPath }).ok, false);
  for (const flag of ['blocked', 'fallbackUsed', 'incomplete', 'quotaExhausted']) {
    const result = validateWorkerResult(workerResult({ [flag]: true }), proof, { runId, runAttempt, role: 'Architect', branch, commit, proofPath });
    assert.ok(result.errors.includes('disallowed_worker_execution_state'), flag);
  }
  assert.ok(validateWorkerResult(workerResult({ taskVerified: false }), proof, { runId, runAttempt, role: 'Architect', branch, commit, proofPath }).errors.includes('task_completion_not_verified'));
  assert.equal(validateWorkerResult(workerResult({ status: 'VERIFIED_NOOP' }), proof, { runId, runAttempt, role: 'Architect', branch, commit, proofPath }).ok, false);
  for (const event of [
    { event: 'provider_fallback', reason: 'provider_http_500' },
    { event: 'quota_exhausted', status: 'blocked' },
  ]) assert.ok(validateWorkerResult(workerResult({providerTelemetry:[event]}),proof,{runId,runAttempt,role:'Architect',branch,commit,proofPath}).errors.includes('fallback_or_quota_observed'));
});

test('proof output is read and hashed; missing, modified, and false digest evidence is rejected', async t => {
  const fixture = await proofFixture(t);
  const expected = { runId, runAttempt, role: 'Architect', branch, commit, proofPath: fixture.proofPath };
  const clean = validateWorkerResult(workerResult(), fixture.proof, expected);
  assert.ok(clean.errors.includes('independent_evidence_provider_unavailable'));
  assert.ok(!clean.errors.includes('independent_task_output_digest_mismatch'));

  const forged = structuredClone(fixture.proof);
  forged.checks[0].outputSha256 = 'b'.repeat(64);
  assert.ok(validateWorkerResult(workerResult(), forged, expected).errors.includes('independent_task_output_digest_mismatch'));

  await writeFile(join(fixture.dir, 'check-output.txt'), 'tampered after evidence was recorded');
  assert.ok(validateWorkerResult(workerResult(), fixture.proof, expected).errors.includes('independent_task_output_digest_mismatch'));

  const missing = structuredClone(fixture.proof);
  missing.checks[0].outputPath = 'missing-output.txt';
  assert.ok(validateWorkerResult(workerResult(), missing, expected).errors.includes('independent_task_output_missing'));
});

test('proof provenance must match run, exact role, branch, and commit', async t => {
  const fixture = await proofFixture(t);
  for (const change of [
    { runId: 'old-run' }, { runAttempt: '1' }, { role: 'architect' }, { branch: 'army/other/architect' }, { commit: 'c'.repeat(40) },
  ]) {
    const result = validateWorkerResult(workerResult(), { ...fixture.proof, ...change }, { runId, runAttempt, role: 'Architect', branch, commit, proofPath: fixture.proofPath });
    assert.ok(result.errors.includes('independent_task_evidence_provenance_mismatch'));
  }
});

test('rejects incomplete, duplicate, extra, stale, and mismatched manifest sets', () => {
  assert.equal(validateRoleSet(records().slice(1), { runId, runAttempt }).ok, false);
  const duplicate = records(); duplicate[1] = { ...duplicate[0] };
  assert.equal(validateRoleSet(duplicate, { runId, runAttempt }).ok, false);
  const wrongRun = records(); wrongRun[0].manifest = manifest(REQUIRED_ROLES[0], { runId: 'old-run' });
  assert.equal(validateRoleSet(wrongRun, { runId, runAttempt }).ok, false);
  const wrongCommit = records(); wrongCommit[0].manifest = manifest(REQUIRED_ROLES[0], { commit: 'b'.repeat(40) });
  assert.equal(validateRoleSet(wrongCommit, { runId, runAttempt }).ok, false);
  const oldAttempt = records(); oldAttempt[0].manifest = manifest(REQUIRED_ROLES[0], { runAttempt: '1' });
  assert.equal(validateRoleSet(oldAttempt, { runId, runAttempt }).ok, false);
});

test('workflow wiring scopes run/role concurrency and keeps persistence gated', async () => {
  const workflow = await readFile('.github/workflows/elite-code-reusable-supervisor.yml', 'utf8');
  assert.match(workflow, /group: elite-supervisor-\$\{\{ github\.repository \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ inputs\.role \}\}/);
  assert.match(workflow, /army-14-manifest\.mjs create/);
  assert.match(workflow, /army-14-independent-proof\.json/);
  assert.match(workflow, /steps\.elite\.outcome != 'success'/);
  assert.match(workflow, /no trusted independent task-evidence producer is configured/);
});

test('create command refuses to emit VERIFIED even with a digest-valid fixture proof', async t => {
  const fixture = await proofFixture(t);
  const resultPath = join(fixture.dir, 'result.json');
  const testsPath = join(fixture.dir, 'tests.json');
  const outputPath = join(fixture.dir, 'manifest.json');
  await writeFile(resultPath, JSON.stringify(workerResult()));
  await writeFile(testsPath, JSON.stringify(testEvidence));
  const command = spawnSync(process.execPath, ['./scripts/army-14-manifest.mjs', 'create',
    '--run-id', runId, '--run-attempt', runAttempt, '--role', 'Architect', '--branch', branch, '--commit', commit,
    '--result', resultPath, '--tests', testsPath, '--proof', fixture.proofPath, '--output', outputPath], { encoding: 'utf8' });
  assert.notEqual(command.status, 0);
  assert.match(command.stderr, /independent_evidence_provider_unavailable/);
  await assert.rejects(readFile(outputPath));
});
