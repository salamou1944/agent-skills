import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';

export const EVOLUTION_LAB_VERSION = 'evolution-lab-v1';
export const LABS = Object.freeze(['baseline','benchmark','evolution','adversarial','performance','recovery','architecture','parallelism','memory-learning','elite-verification','regression']);
const REQUIRED_METRICS = Object.freeze(['successRate','medianMs','p95Ms','retryRate','reworkRate','verificationRate']);
function finite(name, value) { if (!Number.isFinite(value)) throw new Error('metric_not_finite:' + name); return value; }
export function normalizeMetrics(input = {}) {
  const metrics = {};
  for (const name of REQUIRED_METRICS) metrics[name] = finite(name, Number(input[name]));
  if (metrics.successRate < 0 || metrics.successRate > 1) throw new Error('successRate_out_of_range');
  for (const name of ['retryRate','reworkRate','verificationRate']) if (metrics[name] < 0 || metrics[name] > 1) throw new Error(name + '_out_of_range');
  if (metrics.medianMs < 0 || metrics.p95Ms < 0) throw new Error('latency_out_of_range');
  return Object.freeze(metrics);
}
export function compareMetrics(beforeInput, afterInput) {
  const before = normalizeMetrics(beforeInput), after = normalizeMetrics(afterInput);
  return { before, after, delta: {
    successRate: after.successRate - before.successRate,
    medianMsPct: before.medianMs === 0 ? 0 : (after.medianMs - before.medianMs) / before.medianMs,
    p95MsPct: before.p95Ms === 0 ? 0 : (after.p95Ms - before.p95Ms) / before.p95Ms,
    retryRate: after.retryRate - before.retryRate, reworkRate: after.reworkRate - before.reworkRate,
    verificationRate: after.verificationRate - before.verificationRate
  }};
}
export function fingerprintExperiment(experiment) { return createHash('sha256').update(JSON.stringify(experiment)).digest('hex'); }
export function evaluateExperiment({ before, after, safety = {}, requiredSuccessGain = 0.05, requiredLatencyImprovement = 0.10 } = {}) {
  const comparison = compareMetrics(before, after);
  const safetyPass = safety.adversarialPass === true && safety.regressionPass === true && safety.verified === true;
  const successGain = comparison.delta.successRate >= requiredSuccessGain;
  const latencyGain = comparison.delta.medianMsPct <= -requiredLatencyImprovement;
  const qualityGain = comparison.delta.reworkRate <= 0 && comparison.delta.retryRate <= 0;
  const materialImprovement = successGain || latencyGain;
  return Object.freeze({ status: safetyPass && materialImprovement && qualityGain ? 'PROMOTE' : 'REJECT', materialImprovement, safetyPass, successGain, latencyGain, qualityGain, comparison });
}
export function createExperiment({ soldierId, soldierName, hypothesis, labs = LABS, baseline, candidate, safety, metadata = {} } = {}) {
  if (!/^(?:[1-9]|1[0-4])$/.test(String(soldierId))) throw new Error('invalid_soldier_id');
  if (!hypothesis?.trim()) throw new Error('hypothesis_required');
  const evaluation = evaluateExperiment({ before: baseline, after: candidate, safety });
  const fingerprint = fingerprintExperiment({ soldierId, hypothesis, baseline, candidate }).slice(0, 12);
  return Object.freeze({ version: EVOLUTION_LAB_VERSION, experimentId: 'exp-' + Date.now() + '-' + fingerprint, soldierId: String(soldierId), soldierName: soldierName || null, hypothesis, labs: [...new Set(labs)], baseline: normalizeMetrics(baseline), candidate: normalizeMetrics(candidate), evaluation, safety: { ...safety }, metadata: { ...metadata }, createdAt: new Date().toISOString() });
}
export async function appendExperiment(path, experiment) {
  await mkdir(dirname(path), { recursive:true });
  let existing = []; try { existing = JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!Array.isArray(existing)) throw new Error('experiment_ledger_corrupt');
  existing.push(experiment); const temp = path + '.tmp-' + process.pid;
  await writeFile(temp, JSON.stringify(existing, null, 2) + '\n', { mode:0o600 }); await rename(temp, path);
  return { path, experimentId:experiment.experimentId, status:experiment.evaluation.status };
}
export function buildSoldierReport(experiments = []) {
  const grouped = new Map();
  for (const experiment of experiments) { const key = String(experiment.soldierId); if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(experiment); }
  return [...grouped.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([soldierId, rows]) => {
    const promoted = rows.filter(x=>x.evaluation?.status === 'PROMOTE'), latest = rows.at(-1);
    return { soldierId, experiments:rows.length, promoted:promoted.length, rejected:rows.length-promoted.length, latestStatus:latest?.evaluation?.status || 'NONE', latestDelta:latest?.evaluation?.comparison?.delta || null };
  });
}