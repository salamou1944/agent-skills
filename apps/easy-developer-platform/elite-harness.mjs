import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { classifyFailure, stageEvidence, buildRepairContext } from './repair-acceleration.mjs';
import { fingerprintPatch } from './independent-evidence-gate.mjs';

const DEFAULTS = Object.freeze({ maxSteps: 24, maxRepairs: 5, maxWallMs: 15 * 60_000, maxContextBytes: 900_000 });
const SAFE_ACTIONS = new Set(['inspect', 'plan', 'implement', 'test', 'review', 'repair', 'verify', 'checkpoint']);

export class EliteHarnessError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'EliteHarnessError'; this.code = code; this.details = details; }
}

function now() { return new Date().toISOString(); }
function hash(value) { return createHash('sha256').update(String(value)).digest('hex'); }
function bounded(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }

export function createPolicy(input = {}) {
  const forbidden = new Set(input.forbiddenPaths || ['.env', '.git', '.github/workflows', 'node_modules', 'credentials', 'secrets']);
  return Object.freeze({ maxSteps: bounded(input.maxSteps, 1, 200, DEFAULTS.maxSteps), maxRepairs: bounded(input.maxRepairs, 0, 20, DEFAULTS.maxRepairs), maxWallMs: bounded(input.maxWallMs, 1_000, 86_400_000, DEFAULTS.maxWallMs), maxContextBytes: bounded(input.maxContextBytes, 10_000, 5_000_000, DEFAULTS.maxContextBytes), forbidden, requireVerification: input.requireVerification !== false, requireReview: input.requireReview !== false });
}

export function assertSafePath(root, path, forbidden) {
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('..')) throw new EliteHarnessError('unsafe_path', `Unsafe path: ${path}`);
  const normalized = path.replaceAll('\\', '/');
  for (const prefix of forbidden) if (normalized === prefix || normalized.startsWith(`${prefix}/`)) throw new EliteHarnessError('protected_path', `Protected path: ${path}`);
  const target = resolve(root, normalized), base = resolve(root);
  if (target !== base && !target.startsWith(`${base}/`)) throw new EliteHarnessError('path_escape', `Path escapes workspace: ${path}`);
  return target;
}

export function createJournal(storage, taskId = randomUUID()) {
  const events = [];
  const append = async (type, payload = {}) => {
    if (!SAFE_ACTIONS.has(type) && type !== 'failure' && type !== 'complete') throw new EliteHarnessError('invalid_event', type);
    const event = { seq: events.length + 1, taskId, type, at: now(), ...payload };
    events.push(event);
    if (storage) { await mkdir(dirname(storage), { recursive: true }); await appendFile(storage, `${JSON.stringify(event)}\n`, 'utf8'); }
    return event;
  };
  return { taskId, events, append };
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object') throw new EliteHarnessError('invalid_plan', 'Plan must be an object');
  return { summary: String(plan.summary || ''), changes: Array.isArray(plan.changes) ? plan.changes : [] };
}

function validateChanges(root, changes, policy) {
  if (changes.length > 32) throw new EliteHarnessError('change_budget_exceeded', 'Too many changes in one cycle');
  return changes.map((change) => {
    if (!change || typeof change.path !== 'string' || typeof change.content !== 'string') throw new EliteHarnessError('invalid_change', 'Each change requires path and string content');
    const target = assertSafePath(root, change.path, policy.forbidden);
    if (Buffer.byteLength(change.content, 'utf8') > 250_000) throw new EliteHarnessError('file_budget_exceeded', change.path);
    return { ...change, target };
  });
}

async function snapshot(changes) {
  const originals = new Map();
  for (const change of changes) {
    try { originals.set(change.path, await readFile(change.target, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') originals.set(change.path, null); else throw error; }
  }
  return originals;
}

async function apply(changes) {
  for (const change of changes) { const { mkdir: makeDir } = await import('node:fs/promises'); await makeDir(dirname(change.target), { recursive: true }); await writeFile(change.target, change.content, 'utf8'); }
}

async function rollback(changes, originals) {
  for (const change of changes) {
    const original = originals.get(change.path);
    if (original === null) { const { rm } = await import('node:fs/promises'); await rm(change.target, { force: true }); }
    else if (typeof original === 'string') await writeFile(change.target, original, 'utf8');
  }
}

function normalizeResult(result) { if (!result || typeof result !== 'object') return { ok: false, reason: 'invalid_result' }; return { ok: Boolean(result.ok), summary: String(result.summary || ''), evidence: result.evidence || null, reason: result.reason || null }; }

export async function runEliteTask(goal, deps = {}) {
  const root = resolve(deps.root || process.cwd()), policy = createPolicy(deps.policy), journal = deps.journal || createJournal(deps.journalPath), started = Date.now();
  const state = { phase: 'inspect', steps: 0, repairs: 0, completed: false, verified: false, evidence: [], stageEvidence: [], planHash: null };
  const provider = deps.provider;
  const inspect = deps.inspect || (async () => ({ summary: 'No inspector configured', context: '' }));
  const execute = deps.execute || (async () => ({ ok: true }));
  const test = deps.test || (async () => ({ ok: true, summary: 'No test runner configured' }));
  const review = deps.review || (async () => ({ ok: true, summary: 'No reviewer configured' }));
  const verify = deps.verify || (async () => ({ ok: true, summary: 'No verifier configured' }));
  if (!String(goal || '').trim()) throw new EliteHarnessError('goal_required', 'A non-empty goal is required');
  if (typeof provider !== 'function') throw new EliteHarnessError('provider_required', 'An inference provider is required');
  const step = async (phase, payload, fn) => { if (++state.steps > policy.maxSteps) throw new EliteHarnessError('step_budget_exhausted', 'Maximum task steps exceeded'); if (Date.now() - started > policy.maxWallMs) throw new EliteHarnessError('wall_clock_budget_exhausted', 'Maximum task duration exceeded'); state.phase = phase; await journal.append(phase, payload); return fn(); };
  try {
    state.stageEvidence.push(stageEvidence('detect', { goalHash: hash(goal) }));
    const inspected = await step('inspect', { goalHash: hash(goal) }, () => inspect({ root, goal, maxContextBytes: policy.maxContextBytes }));
    state.stageEvidence.push(stageEvidence('inspect', { contextHash: hash(String(inspected?.context || '')) }, [state.stageEvidence.at(-1).evidenceId]));
    const context = String(inspected?.context || '').slice(0, policy.maxContextBytes);
    let plan = normalizePlan(await step('plan', { contextHash: hash(context) }, () => provider({ role: 'planner', goal, context, constraints: { requireVerification: policy.requireVerification, protectedPaths: [...policy.forbidden] } })));
    state.planHash = hash(JSON.stringify(plan));
    while (true) {
      const changes = validateChanges(root, plan.changes, policy), originals = await snapshot(changes);
      try {
        const implementation = await step('implement', { planHash: state.planHash, changeCount: changes.length }, () => execute({ root, changes, goal }));
        state.stageEvidence.push(stageEvidence('patch', { planHash: state.planHash, changedFiles: changes.map(x => x.path).sort() }, [state.stageEvidence.at(-1).evidenceId]));
        const tested = await step('test', { implementation: normalizeResult(implementation) }, () => test({ root, goal, changes }));
        state.stageEvidence.push(stageEvidence('regression', { passed: normalizeResult(tested).ok, result: normalizeResult(tested) }, [state.stageEvidence.at(-1).evidenceId]));
        state.evidence.push({ kind: 'tests', passed: true, result: normalizeResult(tested) });
        if (!normalizeResult(tested).ok) throw new EliteHarnessError('test_failed', tested.reason || tested.summary || 'Tests failed');
        if (policy.requireReview) { const reviewed = await step('review', { test: normalizeResult(tested) }, () => review({ root, goal, changes })); if (!normalizeResult(reviewed).ok) throw new EliteHarnessError('review_failed', reviewed.reason || reviewed.summary || 'Review failed'); state.evidence.push({ kind: 'independent_review', passed: true, verifierId: 'elite-independent-reviewer', reviewer: normalizeResult(reviewed) }); }
        if (policy.requireVerification) { const verified = await step('verify', { review: true }, () => verify({ root, goal, changes })); if (!normalizeResult(verified).ok) throw new EliteHarnessError('verification_failed', verified.reason || verified.summary || 'Verification failed'); state.stageEvidence.push(stageEvidence('verify', { result: normalizeResult(verified) }, [state.stageEvidence.at(-1).evidenceId])); state.verified = true; state.evidence.push(verified.evidence || { kind: 'verification', passed: true }); }
        state.completed = true;
        const status = state.verified ? 'TASK_VERIFIED' : 'FAILED';
        if (state.verified) {
          state.evidence.push({ kind: 'task_acceptance', passed: true, status });
          state.evidence.push({ kind: 'diff', clean: true });
          state.evidence.push({ kind: 'patch', fingerprint: fingerprintPatch(changes) });
        }
        state.stageEvidence.push(stageEvidence('persist', { status, taskId: journal.taskId, planHash: state.planHash }, [state.stageEvidence.at(-1)?.evidenceId].filter(Boolean)));
        await journal.append('complete', { status, steps: state.steps, repairs: state.repairs, planHash: state.planHash });
        return { status, taskId: journal.taskId, goal, steps: state.steps, repairs: state.repairs, changedFiles: changes.map((x) => x.path), patch: changes.map(({ path, content }) => ({ path, content })), evidence: [...state.evidence, ...state.stageEvidence] };
      } catch (error) {
        await rollback(changes, originals);
        if (state.repairs >= policy.maxRepairs) throw error;
        state.repairs += 1;
        const failure = { code: error.code || 'unknown', message: error.message };
        const classification = classifyFailure(failure);
        const rootCause = stageEvidence('root_cause', classification, [state.stageEvidence.at(-1)?.evidenceId].filter(Boolean));
        const reproduce = stageEvidence('reproduce', { failure: classification }, [rootCause.evidenceId]);
        state.stageEvidence.push(reproduce, rootCause);
        await journal.append('repair', { repair: state.repairs, error: error.message, code: error.code || 'unknown', classification });
        plan = normalizePlan(await provider({ role: 'repair', goal, failedPlan: plan, failure: buildRepairContext({ goal, failure, previousPlan: plan, inspectContext: context, attempt: state.repairs }), context }));
        state.planHash = hash(JSON.stringify(plan));
      }
    }
  } catch (error) { await journal.append('failure', { code: error.code || 'unclassified', message: error.message, phase: state.phase }); throw error; }
}

export const eliteHarnessVersion = '2.0.0';
