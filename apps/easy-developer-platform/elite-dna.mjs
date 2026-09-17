import { createHash } from 'node:crypto';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const normalize = path => String(path).replaceAll('\\', '/').replace(/^\.\//, '');
const text = (value, max = 12000) => String(value ?? '').slice(0, max);

export async function buildEngineeringDNA({ root, files = [], imports = {}, goal = '' }) {
  const nodes = files.slice(0, 2000).map(path => ({ path: normalize(path), kind: classify(path) }));
  const edges = [];
  for (const [source, targets] of Object.entries(imports || {})) for (const target of Array.isArray(targets) ? targets : []) edges.push({ source: normalize(source), target: normalize(target) });
  const inbound = new Map();
  for (const edge of edges) inbound.set(edge.target, (inbound.get(edge.target) || 0) + 1);
  const hotspots = nodes.map(node => ({ ...node, fanIn: inbound.get(node.path) || 0 })).filter(node => node.fanIn > 0).sort((a, b) => b.fanIn - a.fanIn).slice(0, 25);
  const payload = { version: 1, root: root ? String(root) : null, goal, fileCount: nodes.length, nodes, edges, hotspots };
  return { ...payload, dnaHash: hash(JSON.stringify(payload)) };
}
function classify(path) { if (/test|spec/i.test(path)) return 'test'; if (/\.github\//.test(path)) return 'automation'; if (/config|env/i.test(path)) return 'config'; return 'source'; }

export function predictImpact({ dna, changedFiles = [] }) {
  const normalized = [...new Set(changedFiles.map(normalize))], affected = new Set(normalized), reasons = [];
  const edges = Array.isArray(dna?.edges) ? dna.edges : [];
  let expanded = true;
  while (expanded) { expanded = false; for (const edge of edges) { if (affected.has(edge.source) && !affected.has(edge.target)) { affected.add(edge.target); expanded = true; reasons.push({ from: edge.source, to: edge.target, reason: 'import_dependency' }); } } }
  const highFanIn = (dna?.hotspots || []).filter(x => affected.has(normalize(x.path)));
  const affectedFiles = [...affected].sort();
  return { changedFiles: normalized, affectedFiles, reasons, riskSignals: highFanIn.map(x => ({ path: x.path, fanIn: x.fanIn, reason: 'high_fan_in' })), predictionHash: hash(JSON.stringify({ normalized, affectedFiles, reasons, highFanIn })) };
}

export async function recordAttempt(path, attempt) {
  const entry = { at: new Date().toISOString(), goalHash: hash(attempt.goal || ''), planHash: hash(JSON.stringify(attempt.plan || {})), failureCode: attempt.failureCode || null, failureHash: hash(attempt.failureMessage || ''), signature: attempt.signature || null, strategy: text(attempt.strategy, 500), changedFiles: (attempt.changedFiles || []).map(normalize).sort() };
  await mkdir(dirname(path), { recursive: true }); await appendFile(path, `${JSON.stringify(entry)}\n`, 'utf8'); return entry;
}
export async function readAttemptLedger(path) { try { const body = await readFile(path, 'utf8'); return body.split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch (error) { if (error.code === 'ENOENT') return []; throw error; } }
export function rejectRepeatedStrategy(ledger, attempt) { const planHash = hash(JSON.stringify(attempt.plan || {})), failureHash = hash(attempt.failureMessage || ''); const prior = ledger.find(entry => entry.planHash === planHash && entry.failureHash === failureHash && entry.failureCode === (attempt.failureCode || null)); return prior ? { ok: false, reason: 'repeated_failed_strategy', prior } : { ok: true }; }
export function createProof({ goal, result, dna, impact, tests = [], review = null, verification = null, immune = null, adversarial = null }) { const proof = { version: 1, goal, status: result?.status || 'unknown', dnaHash: dna?.dnaHash || null, predictionHash: impact?.predictionHash || null, changedFiles: (result?.changedFiles || []).map(normalize).sort(), tests, review, verification, immune, adversarial, generatedAt: new Date().toISOString() }; return { ...proof, proofHash: hash(JSON.stringify(proof)) }; }
export function shadowDelta({ prediction, actualFiles = [] }) { const predicted = new Set((prediction?.affectedFiles || []).map(normalize)), actual = new Set(actualFiles.map(normalize)); return { missed: [...actual].filter(x => !predicted.has(x)).sort(), falsePositives: [...predicted].filter(x => !actual.has(x)).sort(), matched: [...actual].filter(x => predicted.has(x)).sort() }; }
