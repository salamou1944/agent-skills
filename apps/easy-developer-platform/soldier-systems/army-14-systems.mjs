export const ARMY_14_SYSTEM_CONTRACT = 'army-14-soldier-system-v1';

const roster = [
  ['01', 'architect', 'architecture', 'requirements -> architecture -> decision-record -> handoff'],
  ['02', 'builder', 'implementation', 'task -> build -> local-test -> artifact'],
  ['03', 'ui-ux', 'experience', 'journey -> interface -> accessibility -> browser-evidence'],
  ['04', 'backend-api', 'services', 'contract -> implementation -> validation -> runtime-health'],
  ['05', 'database', 'data', 'schema -> migration -> integrity-check -> recovery-point'],
  ['06', 'security', 'security', 'threat-model -> controls -> scan -> fail-closed'],
  ['07', 'integration', 'integration', 'adapter-contract -> provider-boundary -> integration-test -> rollback'],
  ['08', 'ai-agent', 'ai', 'goal -> bounded-tools -> execution -> evidence'],
  ['09', 'test-qa', 'quality', 'acceptance -> tests -> failure-classification -> evidence'],
  ['10', 'browser-e2e', 'browser', 'journey -> browser-run -> assertions -> artifact'],
  ['11', 'debug-repair', 'repair', 'failure -> root-cause -> patch -> regression-test'],
  ['12', 'deployment-ops', 'operations', 'release-plan -> deploy -> health -> rollback'],
  ['13', 'product-mvp', 'product', 'outcome -> vertical-slice -> runtime-verify -> measure'],
  ['14', 'research-capability', 'research', 'question -> evidence -> synthesis -> capability-handoff'],
].map(([id, name, domain, loop]) => ({ id, name, domain, loop }));

export const SOLDIER_SYSTEMS = Object.freeze(
  roster.map((soldier) => Object.freeze({
    contract: ARMY_14_SYSTEM_CONTRACT,
    ...soldier,
    states: Object.freeze(['ready', 'claimed', 'executing', 'verifying', 'recovering', 'completed', 'blocked']),
    requiredEvidence: Object.freeze(['input', 'action', 'verification']),
    recovery: Object.freeze(['retry-safe', 'checkpoint', 'rollback-or-safe-stop']),
    handoff: Object.freeze(['artifact', 'status', 'evidence', 'next_action']),
  })),
);

export function getSoldierSystem(id) {
  return SOLDIER_SYSTEMS.find((soldier) => soldier.id === String(id)) ?? null;
}

export function createSoldierRun({ soldierId, taskId, input }) {
  const soldier = getSoldierSystem(soldierId);
  if (!soldier || !taskId || input === undefined) throw new Error('soldier_run_invalid');
  return {
    contract: ARMY_14_SYSTEM_CONTRACT,
    runId: `${soldier.id}:${taskId}`,
    soldierId: soldier.id,
    taskId,
    state: 'claimed',
    checkpoint: 'claimed',
    input,
    evidence: [],
    nextAction: 'execute',
  };
}

export function transitionSoldierRun(run, state, evidence = null) {
  if (!run || !SOLDIER_SYSTEMS.some((soldier) => soldier.id === run.soldierId)) throw new Error('soldier_run_unknown');
  const allowed = new Set(['ready', 'claimed', 'executing', 'verifying', 'recovering', 'completed', 'blocked']);
  if (!allowed.has(state)) throw new Error('soldier_state_invalid');
  const next = { ...run, state, checkpoint: state, evidence: evidence ? [...run.evidence, evidence] : run.evidence };
  if (state === 'completed' && next.evidence.length < 2) throw new Error('soldier_completion_evidence_insufficient');
  next.nextAction = state === 'completed' ? null : state === 'recovering' ? 'repair-or-retry' : state === 'verifying' ? 'verify' : 'execute';
  return next;
}

export function verifySoldierSystem(run) {
  const soldier = getSoldierSystem(run?.soldierId);
  return Boolean(
    soldier &&
    run.contract === ARMY_14_SYSTEM_CONTRACT &&
    run.taskId &&
    run.state === 'completed' &&
    Array.isArray(run.evidence) &&
    run.evidence.length >= 2 &&
    run.evidence.some((item) => item?.kind === 'verification'),
  );
}

export function army14SystemSnapshot() {
  return {
    contract: ARMY_14_SYSTEM_CONTRACT,
    count: SOLDIER_SYSTEMS.length,
    soldiers: SOLDIER_SYSTEMS.map(({ id, name, domain, loop }) => ({ id, name, domain, loop })),
    invariants: [
      'every soldier has an isolated bounded system contract',
      'every run is checkpointed and resumable',
      'completion requires verification evidence',
      'recovery is retry-safe and supports rollback-or-safe-stop',
      'handoffs are explicit artifacts rather than implicit state',
    ],
  };
}
