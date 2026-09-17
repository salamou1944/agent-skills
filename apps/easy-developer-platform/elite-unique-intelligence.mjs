import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const clean = value => String(value ?? '').replaceAll('\\', '/').replace(/^\.\//, '');

export function generateCounterfactuals({ goal, context = '', constraints = {} }) {
  const base = `${goal}\n${context}`;
  const modes = [['minimal', 'smallest safe change set'], ['isolated', 'change behind a narrow boundary'], ['defensive', 'change plus explicit failure handling'], ['refactor', 'structural change only when required']];
  return modes.map(([id, approach]) => ({ id, approach, hypothesisHash: hash(`${id}\n${base}\n${JSON.stringify(constraints)}`) }));
}
export function chooseCounterfactual({ candidates, constraints = {} }) {
  const list = Array.isArray(candidates) ? candidates : [];
  if (!list.length) return { ok: false, reason: 'no_counterfactuals' };
  const required = String(constraints.requiredMode || 'minimal');
  const selected = list.find(item => item.id === required) || list[0];
  return { ok: true, selected, alternatives: list.filter(item => item !== selected).map(item => item.id) };
}
export function immuneSignature({ failureCode = '', failureMessage = '', changedFiles = [], strategy = '' }) {
  return hash(JSON.stringify({ failureCode: String(failureCode), failureMessage: String(failureMessage), changedFiles: [...new Set(changedFiles.map(clean))].sort(), strategy: String(strategy) }));
}
export function immuneGate({ knownFailures = [], failureCode = '', failureMessage = '', changedFiles = [], strategy = '' }) {
  const signature = immuneSignature({ failureCode, failureMessage, changedFiles, strategy });
  const normalizedFiles = [...new Set(changedFiles.map(clean))].sort();
  const currentCode = String(failureCode || ''), currentStrategy = String(strategy || ''), currentMessageHash = hash(failureMessage || '');
  const known = (knownFailures || []).some(item => {
    if (typeof item === 'string') return item === signature;
    if (item?.signature === signature) return true;
    const files = [...new Set((item?.changedFiles || []).map(clean))].sort();
    const sameCode = item?.failureCode === currentCode;
    const sameStrategy = item?.strategy === currentStrategy;
    const sameMessage = item?.failureHash === currentMessageHash;
    const sameFiles = JSON.stringify(files) === JSON.stringify(normalizedFiles);
    return sameCode && sameStrategy && sameFiles && (sameMessage || !item?.failureHash);
  });
  return known ? { ok: false, reason: 'known_failure_signature', signature } : { ok: true, signature };
}
export async function recordAttempt(path, attempt = {}) {
  const normalized = {
    at: new Date().toISOString(),
    signature: immuneSignature(attempt),
    goalHash: hash(attempt.goal || ''),
    failureCode: String(attempt.failureCode || ''),
    failureHash: hash(attempt.failureMessage || ''),
    failureMessage: String(attempt.failureMessage || ''),
    strategy: String(attempt.strategy || ''),
    changedFiles: [...new Set((attempt.changedFiles || []).map(clean))].sort(),
    plan: attempt.plan || null
  };
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(normalized)}\n`, 'utf8');
  return normalized;
}
export async function readAttemptLedger(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}
export function adversarialProbe({ changes = [], goal = '' }) {
  const findings = [];
  for (const change of changes) {
    const path = clean(change.path), content = String(change.content ?? '');
    if (/\.env(?:\.|$)/i.test(path)) findings.push({ severity: 'critical', path, rule: 'secret_file' });
    if (/\b(?:password|api[_-]?key|secret|token)\s*[:=]\s*['"][^'"]+['"]/i.test(content)) findings.push({ severity: 'critical', path, rule: 'embedded_secret' });
    if (/console\.log\s*\(/.test(content) && !/test|spec/i.test(path)) findings.push({ severity: 'medium', path, rule: 'debug_output' });
    if (/TODO|FIXME|HACK/.test(content)) findings.push({ severity: 'low', path, rule: 'unfinished_marker' });
    if (content.length > 500_000) findings.push({ severity: 'high', path, rule: 'oversized_change' });
  }
  if (!String(goal).trim()) findings.push({ severity: 'critical', path: '<goal>', rule: 'missing_goal' });
  const blocking = findings.filter(item => ['critical', 'high'].includes(item.severity));
  return { ok: blocking.length === 0, findings, blocking, challengeHash: hash(JSON.stringify({ goal, findings })) };
}
export async function appendEvolution(path, event) {
  const entry = { at: new Date().toISOString(), event: String(event?.event || 'unknown'), data: event?.data || {} };
  await mkdir(dirname(path), { recursive: true }); await appendFile(path, `${JSON.stringify(entry)}\n`, 'utf8'); return entry;
}
export function evolutionEvent({ taskId, goal, status, changedFiles = [], proofHash = null }) {
  return { event: status === 'verified' ? 'task_verified' : 'task_finished', data: { taskId: taskId || null, goalHash: hash(goal || ''), status, changedFiles: changedFiles.map(clean).sort(), proofHash } };
}
export function projectScope(project, { shared = false } = {}) {
  const value = String(project || '').trim().toLowerCase();
  if (!value) throw new Error('project_scope_required');
  return { scope: shared ? 'shared' : `project:${value}`, isolation: shared ? 'cross-project-safe' : 'project-isolated' };
}
export function crossProjectSignal({ project, kind, value }) { return { ...projectScope(project), kind: String(kind), valueHash: hash(value) }; }
export function stopAndExplain({ result, proof = null, verification = null, required = ['verified'] }) {
  const status = result?.status, verificationOk = verification?.ok !== false, proofOk = Boolean(proof?.proofHash);
  if (required.includes(status) && verificationOk && proofOk) return { ok: true };
  const reasons = [];
  if (!required.includes(status)) reasons.push(`status_not_accepted:${status || 'unknown'}`);
  if (!verificationOk) reasons.push('verification_failed');
  if (!proofOk) reasons.push('proof_missing');
  return { ok: false, blocked: true, reason: 'evidence_insufficient', reasons };
}
export function integritySummary({ counterfactual, immune, adversarial, evolution, crossProject }) {
  return { version: 1, counterfactualHash: hash(JSON.stringify(counterfactual || {})), immuneSignature: immune?.signature || null, adversarialHash: adversarial?.challengeHash || null, evolutionEvent: evolution?.event || null, crossProjectScope: crossProject?.scope || null };
}
