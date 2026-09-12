#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const args = new Map(process.argv.slice(2).filter((x) => x.startsWith('--')).map((x) => {
  const [key, ...value] = x.slice(2).split('=');
  return [key, value.join('=') || true];
}));

const catalogPath = path.resolve(root, String(args.get('catalog') || '.engineering-update/capability-catalog.json'));
const outputPath = path.resolve(root, String(args.get('output') || '.engineering-update/capability-resolution.json'));
const requestText = String(args.get('request') || '').trim();
const requestPath = args.get('request-file') ? path.resolve(root, String(args.get('request-file'))) : null;

function tokenize(value) {
  return [...new Set(String(value).toLowerCase().match(/[a-z0-9][a-z0-9+.#_-]*/g) || [])];
}

function overlapScore(requestTokens, candidate) {
  const text = `${candidate.name || ''} ${candidate.description || ''} ${candidate.text || ''}`.toLowerCase();
  if (!requestTokens.length) return 0;
  const hits = requestTokens.filter((token) => text.includes(token));
  return hits.length / requestTokens.length;
}

function classify(candidate) {
  const blockers = [];
  if (candidate.duplicate) blockers.push('DUPLICATE');
  if (!candidate.url) blockers.push('NO_SOURCE_URL');
  blockers.push('DISCOVERY_ONLY');
  return { executable: false, blockers };
}

let request = requestText;
if (requestPath) request = (await fs.readFile(requestPath, 'utf8')).trim();
if (!request) throw new Error('A concrete --request or --request-file is required.');

const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog.candidates)) throw new Error('Capability catalog has no candidates array.');

const requestTokens = tokenize(request);
const candidates = catalog.candidates.map((candidate) => {
  const relevance = overlapScore(requestTokens, candidate);
  const discoveryScore = Number(candidate.score || 0);
  const sourceTrust = Number(candidate.sourceTrust || 0);
  const officialBonus = candidate.official ? 0.05 : 0;
  const finalScore = Math.round((0.60 * relevance + 0.25 * discoveryScore + 0.10 * sourceTrust + officialBonus) * 1000) / 1000;
  return {
    id: candidate.id,
    kind: candidate.kind,
    source: candidate.source,
    name: candidate.name,
    description: candidate.description,
    url: candidate.url,
    relevance: Math.round(relevance * 1000) / 1000,
    discoveryScore,
    sourceTrust,
    official: Boolean(candidate.official),
    finalScore,
    promotion: classify(candidate)
  };
}).filter((candidate) => candidate.relevance > 0 || candidate.discoveryScore >= 0.45)
  .sort((a, b) => b.finalScore - a.finalScore || a.id.localeCompare(b.id));

const top = candidates.slice(0, Math.min(10, candidates.length));
const gaps = requestTokens.length === 0 || top.length === 0
  ? [{ type: 'CAPABILITY_GAP', message: 'No capability candidate matched the request strongly enough.' }]
  : [];

const result = {
  version: 1,
  generatedAt: new Date().toISOString(),
  request: { text: request, tokens: requestTokens },
  policy: {
    catalogIsDiscoveryOnly: true,
    executionRequiresPromotion: true,
    sandboxRequired: true,
    noCandidateIsAutomaticallyTrusted: true
  },
  resolution: {
    status: gaps.length ? 'GAP' : 'CANDIDATES_FOUND',
    selected: top[0] || null,
    alternatives: top.slice(1),
    candidateCount: candidates.length,
    gaps
  }
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output: outputPath, status: result.resolution.status, selected: result.resolution.selected?.id || null, alternatives: result.resolution.alternatives.length, gaps: result.resolution.gaps }, null, 2));
