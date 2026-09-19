import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export const EVALUATOR_VERSION = '1.0.0';
const REQUIRED_SIGNALS = Object.freeze(['baseline_revision','candidate_id','candidate_diff_hash','deterministic_tests_passed','adversarial_checks_passed','independent_replay_passed']);

export function evaluatorHash() {
  return createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
}
function exactRevision(workspace) {
  return execFileSync('git', ['rev-parse','HEAD'], { cwd: workspace, encoding: 'utf8' }).trim();
}
export function evaluateHeldOutEvidence({ workspace='.', evidence }) {
  const missing = REQUIRED_SIGNALS.filter(key => evidence?.[key] === undefined || evidence?.[key] === null);
  if (missing.length) return { status:'REJECTED', reason:'heldout_missing_evidence', missing, evaluatorVersion:EVALUATOR_VERSION, evaluatorHash:evaluatorHash() };
  const actualRevision = exactRevision(workspace);
  if (actualRevision !== evidence.baseline_revision) return { status:'REJECTED', reason:'heldout_baseline_mismatch', expected:evidence.baseline_revision, actual:actualRevision, evaluatorVersion:EVALUATOR_VERSION, evaluatorHash:evaluatorHash() };
  const failures = ['deterministic_tests_passed','adversarial_checks_passed','independent_replay_passed'].filter(key => evidence[key] !== true);
  if (failures.length) return { status:'REJECTED', reason:'heldout_acceptance_failed', failed:failures, evaluatorVersion:EVALUATOR_VERSION, evaluatorHash:evaluatorHash() };
  if (!/^[a-f0-9]{64}$/.test(String(evidence.candidate_diff_hash))) return { status:'REJECTED', reason:'heldout_invalid_diff_hash', evaluatorVersion:EVALUATOR_VERSION, evaluatorHash:evaluatorHash() };
  return { status:'HELDOUT_VERIFIED', evaluatorVersion:EVALUATOR_VERSION, evaluatorHash:evaluatorHash(), baselineRevision:actualRevision, candidateId:evidence.candidate_id, candidateDiffHash:evidence.candidate_diff_hash };
}
