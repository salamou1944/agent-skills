export const ARMY_14_SYSTEM_CONTRACT = 'army-14-soldier-system-v2';

const STATES = Object.freeze(['ready', 'claimed', 'executing', 'verifying', 'recovering', 'completed', 'blocked']);
const TRANSITIONS = Object.freeze({
  ready: new Set(['claimed', 'blocked']),
  claimed: new Set(['executing', 'blocked']),
  executing: new Set(['verifying', 'recovering', 'blocked']),
  verifying: new Set(['completed', 'recovering', 'blocked']),
  recovering: new Set(['claimed', 'executing', 'blocked']),
  completed: new Set([]),
  blocked: new Set(['claimed', 'recovering']),
});

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

const profiles = Object.freeze({
  '01': ['architecture-valid', 'decision-record', 'handoff-integrity'],
  '02': ['build-valid', 'tests-pass', 'artifact-integrity'],
  '03': ['journey-valid', 'accessibility-check', 'browser-evidence'],
  '04': ['contract-valid', 'runtime-health', 'failure-safe'],
  '05': ['schema-integrity', 'migration-safe', 'recovery-point'],
  '06': ['threat-model', 'control-enforcement', 'fail-closed'],
  '07': ['adapter-boundary', 'provider-neutral', 'rollback-safe'],
  '08': ['bounded-tools', 'policy-gate', 'execution-evidence'],
  '09': ['acceptance-criteria', 'negative-tests', 'regression-evidence'],
  '10': ['browser-journey', 'assertions', 'artifact-capture'],
  '11': ['root-cause', 'minimal-patch', 'regression-proof'],
  '12': ['release-gate', 'health-check', 'rollback-ready'],
  '13': ['user-outcome', 'vertical-slice', 'runtime-verify'],
  '14': ['source-quality', 'evidence-chain', 'capability-handoff'],
});

export const SOLDIER_SYSTEMS = Object.freeze(
  roster.map((soldier) => Object.freeze({
    contract: ARMY_14_SYSTEM_CONTRACT,
    ...soldier,
    controls: Object.freeze(profiles[soldier.id]),
    states: STATES,
    requiredEvidence: Object.freeze(['input', 'action', 'verification']),
    recovery: Object.freeze(['retry-safe', 'checkpoint', 'rollback-or-safe-stop']),
    handoff: Object.freeze(['artifact', 'status', 'evidence', 'next_action']),
    invariants: Object.freeze(['bounded-scope', 'fail-closed', 'no-silent-skip', 'reproducible-verification']),
  })),
);

export function getSoldierSystem(id) {
  return SOLDIER_SYSTEMS.find((soldier) => soldier.id === String(id)) ?? null;
}

function assertEvidence(evidence, runId) {
  if (!evidence || typeof evidence !== 'object' || typeof evidence.kind !== 'string' || evidence.kind.length === 0) {
    throw new Error('soldier_evidence_invalid');
  }
  if (evidence.runId !== runId) throw new Error('soldier_evidence_run_mismatch');
  if (typeof evidence.evidenceId !== 'string' || evidence.evidenceId.length === 0) throw new Error('soldier_evidence_id_invalid');
}

export function createSoldierRun({ soldierId, taskId, input }) {
  const soldier = getSoldierSystem(soldierId);
  if (!soldier || typeof taskId !== 'string' || taskId.length === 0 || input === undefined) throw new Error('soldier_run_invalid');
  return {
    contract: ARMY_14_SYSTEM_CONTRACT,
    runId: `${soldier.id}:${taskId}`,
    soldierId: soldier.id,
    taskId,
    state: 'claimed',
    checkpoint: 'claimed',
    input,
    revision: 0,
    evidence: [{ kind: 'input', ok: true, runId: `${soldier.id}:${taskId}`, evidenceId: 'input' }],
    nextAction: 'execute',
  };
}

export function transitionSoldierRun(run, state, evidence = null, options = {}) {
  if (!run || !SOLDIER_SYSTEMS.some((soldier) => soldier.id === run.soldierId)) throw new Error('soldier_run_unknown');
  if (!Number.isInteger(run.revision) || run.revision < 0) throw new Error('soldier_revision_invalid');
  if (options.expectedRevision !== undefined && options.expectedRevision !== run.revision) throw new Error('soldier_revision_conflict');
  if (!STATES.includes(state)) throw new Error('soldier_state_invalid');
  if (!TRANSITIONS[run.state]?.has(state)) throw new Error('soldier_transition_invalid');
  if (evidence !== null) assertEvidence(evidence, run.runId);
  if (evidence && run.evidence.some((item) => item.evidenceId === evidence.evidenceId)) {
    throw new Error('soldier_evidence_duplicate');
  }
  const evidenceList = evidence ? [...run.evidence, evidence] : run.evidence;
  if (state === 'completed' && !evidenceList.some((item) => item.kind === 'verification' && item.ok === true)) {
    throw new Error('soldier_completion_verification_missing');
  }
  const next = { ...run, state, checkpoint: state, revision: run.revision + 1, evidence: evidenceList };
  next.nextAction = state === 'completed' ? null : state === 'recovering' ? 'repair-or-retry' : state === 'verifying' ? 'verify' : 'execute';
  return next;
}

export function verifySoldierSystem(run) {
  const soldier = getSoldierSystem(run?.soldierId);
  return Boolean(
    soldier &&
    run.contract === ARMY_14_SYSTEM_CONTRACT &&
    typeof run.taskId === 'string' &&
    run.state === 'completed' &&
    run.checkpoint === 'completed' &&
    Number.isInteger(run.revision) &&
    Array.isArray(run.evidence) &&
    run.evidence.some((item) => item?.kind === 'input' && item?.ok === true && item?.runId === run.runId) &&
    run.evidence.some((item) => item?.kind === 'action' && item?.ok === true && item?.runId === run.runId) &&
    run.evidence.some((item) => item?.kind === 'verification' && item?.ok === true && item?.runId === run.runId),
  );
}

export function army14SystemSnapshot() {
  return {
    contract: ARMY_14_SYSTEM_CONTRACT,
    count: SOLDIER_SYSTEMS.length,
    soldiers: SOLDIER_SYSTEMS.map(({ id, name, domain, loop, controls }) => ({ id, name, domain, loop, controls })),
    invariants: [
      'every soldier has an isolated bounded system contract',
      'every run follows an explicit state machine',
      'every run is checkpointed and resumable',
      'completion requires input + action + successful verification evidence',
      'invalid transitions and malformed evidence fail closed',
      'recovery is retry-safe and supports rollback-or-safe-stop',
      'handoffs are explicit artifacts rather than implicit state',
    ],
  };
}
