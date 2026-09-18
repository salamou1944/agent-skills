import { createHash } from 'node:crypto';

export const TASK_CONTRACT_VERSION = 'task-contract-v1';

export function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value, Object.keys(value ?? {}).sort())).digest('hex');
}

export function createTaskContract(task, baseline = {}) {
  if (!task?.id || !task?.goal || !task?.verify) throw new Error('task_contract_invalid');
  return Object.freeze({
    version: TASK_CONTRACT_VERSION,
    taskId: task.id,
    phase: task.phase,
    scope: task.scope,
    repo: task.repo ?? 'salamou1944/agent-skills',
    goal: task.goal,
    acceptance: {
      required: ['observable-change-or-authorized-noop', 'task-specific-verification', 'evidence-capsule'],
      forbidden: ['historical-evidence-only', 'pipeline-pass-as-task-pass', 'simulated-live-revenue'],
    },
    baseline: {
      commit: baseline.commit ?? null,
      stateFingerprint: baseline.stateFingerprint ?? null,
    },
    verification: {
      command: task.verify,
      requiredExitCode: 0,
    },
    evidence: {
      required: ['baseline', 'action', 'verification', 'result'],
      revenueRequires: ['provider-or-customer-event-evidence'],
    },
  });
}

export function validateTaskResult(contract, result) {
  if (!contract || contract.version !== TASK_CONTRACT_VERSION) return { ok:false, reason:'contract_invalid' };
  if (!result || result.taskId !== contract.taskId) return { ok:false, reason:'task_mismatch' };
  if (!['VERIFIED','NOOP','BLOCKED','FAILED'].includes(result.status)) return { ok:false, reason:'status_invalid' };
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  const kinds = new Set(evidence.map(e => e?.kind));
  for (const required of contract.evidence.required) {
    if (!kinds.has(required)) return { ok:false, reason:`evidence_missing:${required}` };
  }
  if (result.status === 'VERIFIED' && !result.verification?.passed) return { ok:false, reason:'verification_not_passed' };
  if (result.status === 'NOOP' && !result.noopAuthorized) return { ok:false, reason:'noop_not_authorized' };
  if (result.revenueVerified === true && !contract.evidence.revenueRequires.every(k => kinds.has(k))) {
    return { ok:false, reason:'revenue_evidence_incomplete' };
  }
  return { ok:true };
}
