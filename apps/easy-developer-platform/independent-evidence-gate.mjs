#!/usr/bin/env node

import { createHash } from 'node:crypto';

const TERMINAL = new Set(['TASK_VERIFIED', 'VERIFIED', 'VERIFIED_NOOP', 'NOOP_VERIFIED']);
const REQUIRED_EVIDENCE = new Set(['task_acceptance', 'tests', 'diff', 'independent_review']);

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
}

export function fingerprintPatch(patch) {
  return createHash('sha256').update(stable(patch ?? {})).digest('hex');
}

export function validateEvidence(result, { requireIndependent = true } = {}) {
  const errors = [];
  const status = String(result?.status ?? '').trim();
  if (!TERMINAL.has(status)) errors.push('status_not_task_verified');

  const evidence = Array.isArray(result?.evidence) ? result.evidence : [];
  const kinds = new Set(evidence.map(item => String(item?.kind ?? '').trim()).filter(Boolean));
  for (const kind of REQUIRED_EVIDENCE) {
    if (!kinds.has(kind)) errors.push('missing_evidence:' + kind);
  }

  if (requireIndependent) {
    const independent = evidence.find(item => item?.kind === 'independent_review');
    if (!independent?.verifierId || independent.verifierId === result?.agentId) {
      errors.push('independent_verifier_required');
    }
  }

  if (result?.taskAcceptance?.passed !== true) errors.push('task_acceptance_not_passed');
  if (result?.tests?.passed !== true) errors.push('tests_not_passed');
  if (result?.diff?.clean !== true) errors.push('diff_not_clean');

  if (!result?.patchFingerprint || result.patchFingerprint !== fingerprintPatch(result?.patch)) {
    errors.push('patch_fingerprint_mismatch');
  }

  if (result?.benchmark?.groundTruthExposed === true) errors.push('benchmark_ground_truth_exposed');
  if (result?.benchmark?.hiddenEvaluationLeaked === true) errors.push('benchmark_hidden_evaluation_leaked');

  return { ok: errors.length === 0, errors };
}

export function assertIndependentEvidence(result, options) {
  const validation = validateEvidence(result, options);
  if (!validation.ok) throw new Error('independent_evidence_rejected:' + validation.errors.join(','));
  return result;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const raw = process.env.RESULT_JSON || process.argv.slice(2).join(' ').trim();
  if (!raw) {
    console.error('result_required');
    process.exit(2);
  }
  try {
    const result = JSON.parse(raw);
    process.stdout.write(JSON.stringify(assertIndependentEvidence(result)) + '\n');
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    process.exit(1);
  }
}
