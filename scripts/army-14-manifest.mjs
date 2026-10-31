#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_ROLES = [
  'Architect', 'Builder', 'UI-UX', 'Backend-API', 'Database', 'Security',
  'Integration', 'AI-Agent', 'Test-QA', 'Browser-E2E', 'Debug-Repair',
  'Deployment-Ops', 'Product-MVP', 'Research-Capability',
];

export function roleSlug(role) {
  return String(role).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function manifestPath(runId, role) {
  if (!String(runId).trim() || !roleSlug(role)) throw new Error('manifest_path_input_invalid');
  return `.army-14/manifests/${runId}/${roleSlug(role)}.json`;
}

function independentProofErrors(proof, { runId, runAttempt, role, branch, commit, proofPath } = {}) {
  const errors = [];
  if (!proof || proof.schema !== 'army-14-independent-task-evidence/v1' || proof.status !== 'PASS') errors.push('independent_task_evidence_missing');
  if (proof && (proof.runId !== String(runId) || proof.runAttempt !== String(runAttempt) || proof.role !== role || proof.branch !== branch || proof.commit !== commit)) errors.push('independent_task_evidence_provenance_mismatch');
  if (!Array.isArray(proof?.checks) || proof.checks.length === 0) errors.push('independent_task_checks_invalid');
  for (const check of proof?.checks ?? []) {
    if (check?.taskSpecific !== true || check?.passed !== true || typeof check.command !== 'string' || !check.command.trim() || typeof check.outputPath !== 'string' || !/^[a-f0-9]{64}$/i.test(String(check.outputSha256))) {
      errors.push('independent_task_checks_invalid');
      continue;
    }
    if (!proofPath) { errors.push('independent_task_output_unavailable'); continue; }
    const root = realpathSync(resolve(dirname(proofPath)));
    const output = resolve(root, check.outputPath);
    const rel = relative(root, output);
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) { errors.push('independent_task_output_path_invalid'); continue; }
    try {
      const actualPath = realpathSync(output);
      const actualRel = relative(root, actualPath);
      if (!actualRel || actualRel === '..' || actualRel.startsWith(`..${sep}`) || isAbsolute(actualRel)) {
        errors.push('independent_task_output_path_invalid');
        continue;
      }
      const actual = createHash('sha256').update(readFileSync(actualPath)).digest('hex');
      if (actual !== String(check.outputSha256).toLowerCase()) errors.push('independent_task_output_digest_mismatch');
    } catch {
      errors.push('independent_task_output_missing');
    }
  }
  // No trusted independent verifier or evidence producer is currently wired into this workflow.
  errors.push('independent_evidence_provider_unavailable');
  return errors;
}

export function validateWorkerResult(result, proof, { runId, runAttempt, role, branch, commit, proofPath } = {}) {
  const errors = [];
  if (!result || result.status !== 'VERIFIED') errors.push('task_status_not_verified');
  if (result?.taskVerified !== true || result?.pipelineVerified !== true || result?.verified === false) errors.push('task_completion_not_verified');
  if (result?.blocked === true || result?.fallbackUsed === true || result?.incomplete === true || result?.quotaExhausted === true) errors.push('disallowed_worker_execution_state');
  if (!Array.isArray(result?.changedFiles) || result.changedFiles.length === 0) errors.push('task_changes_missing');
  const telemetry = Array.isArray(result?.providerTelemetry) ? result.providerTelemetry : [];
  if (telemetry.some(event => /fallback|quota/i.test(`${event?.event ?? ''} ${event?.reason ?? ''} ${event?.status ?? ''}`))) errors.push('fallback_or_quota_observed');
  errors.push(...independentProofErrors(proof, { runId, runAttempt, role, branch, commit, proofPath }));
  return { ok: errors.length === 0, errors };
}

export function validateManifest(manifest, { runId, runAttempt, role, branch, commit, proofPath } = {}) {
  const errors = [];
  const expectedBranch = `army/${runId}/${roleSlug(role)}`;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { ok: false, errors: ['manifest_invalid'] };
  if (manifest.schema !== 'army-14-worker-manifest/v1') errors.push('schema_invalid');
  if (manifest.status !== 'VERIFIED') errors.push('status_not_verified');
  if (manifest.taskVerified !== true) errors.push('task_not_verified');
  if (manifest.pipelineVerified !== true) errors.push('pipeline_not_verified');
  if (manifest.fallbackUsed === true || manifest.blocked === true || manifest.incomplete === true || manifest.quotaExhausted === true) errors.push('disallowed_execution_state');
  if (manifest.runId !== String(runId)) errors.push('run_id_mismatch');
  if (manifest.runAttempt !== String(runAttempt)) errors.push('run_attempt_mismatch');
  if (manifest.role !== role) errors.push('role_mismatch');
  if (manifest.branch !== expectedBranch || branch !== expectedBranch) errors.push('branch_mismatch');
  if (!/^[a-f0-9]{40}$/i.test(String(manifest.commit)) || (commit && manifest.commit !== commit)) errors.push('commit_invalid_or_stale');
  if (!Array.isArray(manifest.changedFiles) || manifest.changedFiles.length === 0 || manifest.changedFiles.some(x => typeof x !== 'string' || !x.trim())) errors.push('task_evidence_missing');
  if (!Array.isArray(manifest.tests) || manifest.tests.length === 0 || manifest.tests.some(t => !t || t.passed !== true || typeof t.command !== 'string' || !t.command.trim())) errors.push('test_evidence_missing');
  errors.push(...independentProofErrors(manifest.independentEvidence, { runId, runAttempt, role, branch: expectedBranch, commit: manifest.commit, proofPath }));
  if (!manifest.createdAt || Number.isNaN(Date.parse(manifest.createdAt))) errors.push('timestamp_invalid');
  return { ok: errors.length === 0, errors };
}

export function validateRoleSet(records, { runId, runAttempt, roles = REQUIRED_ROLES } = {}) {
  if (!Array.isArray(records)) return { ok: false, errors: ['records_invalid'] };
  const errors = [];
  for (const role of roles) {
    const matching = records.filter(r => r?.manifest?.role === role);
    if (matching.length !== 1) { errors.push(`${role}:expected_exactly_one_manifest`); continue; }
    const { manifest, branch, tip } = matching[0];
    const result = validateManifest(manifest, { runId, runAttempt, role, branch, commit: manifest.commit });
    for (const error of result.errors) errors.push(`${role}:${error}`);
  }
  if (records.length !== roles.length) errors.push('unexpected_or_duplicate_records');
  return { ok: errors.length === 0, errors };
}

function value(args, key) {
  const index = args.indexOf(`--${key}`);
  if (index < 0 || !args[index + 1]) throw new Error(`missing_${key}`);
  return args[index + 1];
}

async function main(args) {
  const [command, ...rest] = args;
  if (command === 'role-slug') {
    process.stdout.write(roleSlug(value(rest, 'role')));
    return;
  }
  if (command === 'manifest-path') {
    process.stdout.write(manifestPath(value(rest, 'run-id'), value(rest, 'role')));
    return;
  }
  if (command === 'validate-set') {
    const records = JSON.parse(await readFile(value(rest, 'records'), 'utf8'));
    const result = validateRoleSet(records, { runId: value(rest, 'run-id'), runAttempt: value(rest, 'run-attempt') });
    if (!result.ok) throw new Error(`role_set_invalid:${result.errors.join(',')}`);
    return;
  }
  if (command !== 'create') throw new Error('unsupported_command');
  const runId = value(rest, 'run-id');
  const runAttempt = value(rest, 'run-attempt');
  const role = value(rest, 'role');
  const branch = value(rest, 'branch');
  const commit = value(rest, 'commit');
  const result = JSON.parse(await readFile(value(rest, 'result'), 'utf8'));
  const tests = JSON.parse(await readFile(value(rest, 'tests'), 'utf8'));
  const proofPath = resolve(value(rest, 'proof'));
  const proof = JSON.parse(await readFile(proofPath, 'utf8'));
  const output = value(rest, 'output');
  if (!/^[a-f0-9]{40}$/i.test(commit)) throw new Error('commit_invalid');
  if (!REQUIRED_ROLES.includes(role)) throw new Error('role_invalid');
  const resultCheck = validateWorkerResult(result, proof, { runId, runAttempt, role, branch, commit, proofPath });
  if (!resultCheck.ok) throw new Error(resultCheck.errors.join(','));
  const manifest = {
    schema: 'army-14-worker-manifest/v1', status: 'VERIFIED', runId, runAttempt, role,
    branch, commit, taskVerified: true, pipelineVerified: true,
    fallbackUsed: false, blocked: false, incomplete: false, quotaExhausted: false,
    changedFiles: result.changedFiles,
    independentEvidence: proof,
    tests,
    summary: result.summary,
    createdAt: new Date().toISOString(),
  };
  if (output !== manifestPath(runId, role)) throw new Error('manifest_output_path_mismatch');
  const check = validateManifest(manifest, { runId, runAttempt, role, branch, commit });
  if (!check.ok) throw new Error(`manifest_invalid:${check.errors.join(',')}`);
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });

