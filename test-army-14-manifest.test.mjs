import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { REQUIRED_ROLES, roleSlug, validateManifest, validateRoleSet, validateWorkerResult } from './scripts/army-14-manifest.mjs';

const runId = '123456789';
const commit = 'a'.repeat(40);
const testEvidence = [{ command: 'npm test', passed: true }];
const proof = { schema: 'army-14-independent-task-evidence/v1', status: 'PASS', runId, role: 'Architect', commit, checks: [{ command: 'targeted regression', taskSpecific: true, passed: true, outputSha256: 'b'.repeat(64) }] };
function manifest(role, overrides = {}) {
  return {
    schema: 'army-14-worker-manifest/v1', status: 'VERIFIED', runId, role,
    branch: `army/${runId}/${roleSlug(role)}`, commit, taskVerified: true,
    pipelineVerified: true, fallbackUsed: false, blocked: false, incomplete: false,
    quotaExhausted: false, changedFiles: ['src/fix.mjs'], tests: testEvidence,
    independentEvidence: { ...proof, role },
    createdAt: '2026-10-31T00:00:00.000Z', ...overrides,
  };
}
function records() {
  return REQUIRED_ROLES.map(role => ({ manifest: manifest(role), branch: `army/${runId}/${roleSlug(role)}`, tip: commit }));
}

test('role slugs are normalized and all 14 role branches are unique', () => {
  const slugs = REQUIRED_ROLES.map(roleSlug);
  assert.equal(REQUIRED_ROLES.length, 14);
  assert.equal(new Set(slugs).size, 14);
  assert.equal(roleSlug('UI-UX'), 'ui-ux');
  assert.equal(roleSlug('Backend/API'), 'backend-api');
});

test('accepts one complete, current VERIFIED manifest per required role', () => {
  const result = validateRoleSet(records(), { runId });
  assert.deepEqual(result, { ok: true, errors: [] });
});

test('accepts genuine task success and rejects provider fallback or quota even after recovery', () => {
  const valid = { status: 'VERIFIED', taskVerified: true, pipelineVerified: true, changedFiles: ['src/fix.mjs'], providerTelemetry: [{ ok: true, status: 200 }] };
  assert.equal(validateWorkerResult(valid, proof, { runId, role: 'Architect', commit }).ok, true);
  assert.equal(validateWorkerResult(valid, undefined, { runId, role: 'Architect', commit }).ok, false);
  for (const event of [
    { event: 'provider_fallback', reason: 'provider_quota_exhausted' },
    { event: 'provider_fallback', reason: 'provider_http_500' },
    { status: 429, reason: 'insufficient_quota' },
  ]) assert.equal(validateWorkerResult({ ...valid, providerTelemetry: [event] }, proof, { runId, role: 'Architect', commit }).ok, false);
  assert.equal(validateWorkerResult({ ...valid, status: 'VERIFIED_NOOP', changedFiles: [] }, proof, { runId, role: 'Architect', commit }).ok, false);
});

test('rejects missing, duplicate, unexpected, and wrong-run records', () => {
  assert.equal(validateRoleSet(records().slice(1), { runId }).ok, false);
  const duplicate = records(); duplicate[1] = { ...duplicate[0] };
  assert.equal(validateRoleSet(duplicate, { runId }).ok, false);
  const wrongRun = records(); wrongRun[0].manifest = manifest(REQUIRED_ROLES[0], { runId: 'old-run' });
  assert.equal(validateRoleSet(wrongRun, { runId }).ok, false);
});

test('rejects fallback, quota exhaustion, blocked, incomplete, and taskVerified=false', () => {
  for (const overrides of [
    { fallbackUsed: true }, { quotaExhausted: true }, { blocked: true },
    { incomplete: true }, { taskVerified: false }, { status: 'PIPELINE_VERIFIED' },
    { status: 'FAILED' }, { status: 'CANCELLED' },
  ]) {
    assert.equal(validateManifest(manifest('Architect', overrides), {
      runId, role: 'Architect', branch: `army/${runId}/architect`, commit,
    }).ok, false, JSON.stringify(overrides));
  }
});

test('rejects stale commit, invalid branch, missing task evidence, and failed tests', () => {
  const expected = { runId, role: 'Architect', branch: `army/${runId}/architect`, commit };
  for (const overrides of [
    { commit: 'b'.repeat(40) }, { branch: 'army/old-run/architect' },
    { changedFiles: [] }, { tests: [] }, { tests: [{ command: 'npm test', passed: false }] },
  ]) assert.equal(validateManifest(manifest('Architect', overrides), expected).ok, false);
});

test('workflow wiring scopes worker concurrency and requires the full verified role set', async () => {
  const workflow = await readFile('.github/workflows/elite-code-reusable-supervisor.yml', 'utf8');
  assert.match(workflow, /group: elite-supervisor-\$\{\{ github\.repository \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ inputs\.role \}\}/);
  assert.match(workflow, /army-14-manifest\.mjs create/);
  assert.match(workflow, /army-14-independent-proof\.json/);
  assert.match(workflow, /taskCompletion_not_verified|task_completion_not_verified/);
  assert.match(workflow, /steps\.elite\.outcome != 'success'/);
});

