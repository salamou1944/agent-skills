import { createHash } from 'node:crypto';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const text = (value, max = 12000) => String(value ?? '').slice(0, max);

/**
 * Elite Engineering DNA is a deterministic project fingerprint plus a change-impact
 * shadow. It is intentionally evidence-based: it never claims a predicted edge exists
 * unless the repository itself provides the import relationship.
 */
export async function buildEngineeringDNA({ root, files = [], imports = {}, goal = '' }) {
  const nodes = files.slice(0, 2000).map(path => ({ path, kind: classify(path) }));
  const edges = [];
  for (const [source, targets] of Object.entries(imports || {})) {
    for (const target of Array.isArray(targets) ? targets : []) edges.push({ source, target });
  }
  const inbound = new Map();
  for (const edge of edges) inbound.set(edge.target, (inbound.get(edge.target) || 0) + 1);
  const hotspots = nodes
    .map(node => ({ ...node, fanIn: inbound.get(node.path) || 0 }))
    .filter(node => node.fanIn > 0)
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, 25);
  const payload = { version: 1, goal, fileCount: nodes.length, nodes, edges, hotspots };
  return { ...payload, dnaHash: hash(JSON.stringify(payload)) };
}

function classify(path) {
  if (/test|spec/i.test(path)) return 'test';
  if (/\.github\//.test(path)) return 'automation';
  if (/config|env/i.test(path)) return 'config';
  return 'source';
}

export function predictImpact({ dna, changedFiles = [] }) {
  const normalized = changedFiles.map(String);
  const affected = new Set(normalized);
  const reasons = [];
  const edges = Array.isArray(dna?.edges) ? dna.edges : [];
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const edge of edges) {
      const source = normalize(edge.source);
      const target = normalize(edge.target);
      if (affected.has(source) && !affected.has(target)) { affected.add(target); expanded = true; reasons.push({ from: source, to: target, reason: 'import_dependency' }); }
    }
  }
  const highFanIn = (dna?.hotspots || []).filter(x => affected.has(normalize(x.path)));
  return {
    changedFiles: normalized,
    affectedFiles: [...affected].sort(),
    riskSignals: highFanIn.map(x => ({ path: x.path, fanIn: x.fanIn, reason: 'high_fan_in' })),
    predictionHash: hash(JSON.stringify({ normalized, affected: [...affected].sort(), highFanIn }))
  };
}

function normalize(path) {
  return String(path).replaceAll('\\', '/').replace(/^\.\//, '');
}

export async function recordAttempt(path, attempt) {
  const entry = {
    at: new Date().toISOString(),
    goalHash: hash(attempt.goal || ''),
    planHash: hash(JSON.stringify(attempt.plan || {})),
    failureCode: attempt.failureCode || null,
    failureHash: hash(attempt.failureMessage || ''),
    strategy: text(attempt.strategy, 500)
  };
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

export async function readAttemptLedger(path) {
  try {
    const body = await readFile(path, 'utf8');
    return body.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export function rejectRepeatedStrategy(ledger, attempt) {
  const planHash = hash(JSON.stringify(attempt.plan || {}));
  const failureHash = hash(attempt.failureMessage || '');
  const prior = ledger.find(entry => entry.planHash === planHash && entry.failureHash === failureHash && entry.failureCode === (attempt.failureCode || null));
  return prior ? { ok: false, reason: 'repeated_failed_strategy', prior } : { ok: true };
}

export function createProof({ goal, result, dna, impact, tests = [], review = null, verification = null }) {
  const proof = {
    version: 1,
    goal,
    status: result?.status || 'unknown',
    dnaHash: dna?.dnaHash || null,
    predictionHash: impact?.predictionHash || null,
    changedFiles: result?.changedFiles || [],
    tests,
    review,
    verification,
    generatedAt: new Date().toISOString()
  };
  return { ...proof, proofHash: hash(JSON.stringify(proof)) };
}

export function shadowDelta({ prediction, actualFiles = [] }) {
  const predicted = new Set(prediction?.affectedFiles || []);
  const actual = new Set(actualFiles.map(normalize));
  return {
    missed: [...actual].filter(x => !predicted.has(x)).sort(),
    falsePositives: [...predicted].filter(x => !actual.has(x)).sort(),
    matched: [...actual].filter(x => predicted.has(x)).sort()
  };
}
