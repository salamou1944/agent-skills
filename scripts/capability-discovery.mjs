#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceConfig = JSON.parse(await fs.readFile(path.join(root, 'config/capability-sources.json'), 'utf8'));

const DEFAULT_QUERIES = [
  'software architecture', 'codebase analysis', 'implementation', 'testing',
  'debugging', 'security', 'browser automation', 'API integration', 'database',
  'DevOps CI/CD', 'documentation', 'GitHub', 'code review', 'research'
];

const args = new Map(process.argv.slice(2).filter(x => x.startsWith('--')).map(x => {
  const [k, ...v] = x.slice(2).split('=');
  return [k, v.join('=') || true];
}));
const queries = args.has('queries') ? String(args.get('queries')).split(',').map(x => x.trim()).filter(Boolean) : DEFAULT_QUERIES;
const limit = Math.min(Number(args.get('limit') || 50), 200);
const output = path.resolve(root, String(args.get('output') || '.engineering-update/capability-catalog.json'));
const includeMcp = args.get('mcp') !== 'false';

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { accept: 'application/json', ...(options.headers || {}) },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function normalizeSkill(item, source, query) {
  const id = item.id || `${item.source || source.id}/${item.slug || item.name || 'unknown'}`;
  const text = `${item.name || ''} ${item.slug || ''} ${item.description || ''}`.toLowerCase();
  return {
    id, kind: 'skill', source: source.id,
    name: item.name || item.slug || id,
    description: item.description || '', installs: Number(item.installs || 0),
    official: Boolean(item.official || source.id === 'anthropic-skills'),
    duplicate: Boolean(item.isDuplicate), url: item.url || item.installUrl || null,
    text, matchedQuery: query, sourceTrust: source.trust
  };
}

function normalizeMcp(item, source) {
  const server = item.server || item;
  const name = server.name || server.title || 'unknown';
  return {
    id: server.name || `${source.id}/${name}`, kind: 'mcp', source: source.id,
    name, description: server.description || '', installs: 0,
    official: source.id === 'mcp-registry', duplicate: false,
    url: server.repository?.url || server.websiteUrl || null,
    text: `${name} ${server.description || ''}`.toLowerCase(),
    matchedQuery: 'mcp server tools', sourceTrust: source.trust
  };
}

function score(item) {
  const q = item.matchedQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const exact = q.filter(token => item.text.includes(token)).length / Math.max(q.length, 1);
  const popularity = Math.min(Math.log10(item.installs + 1) / 7, 1);
  const official = item.official ? 0.10 : 0;
  const duplicatePenalty = item.duplicate ? 0.35 : 0;
  return Math.max(0, Math.round((0.45 * exact + 0.25 * popularity + 0.20 * item.sourceTrust + official - duplicatePenalty) * 1000) / 1000);
}

const catalog = new Map();
const sourceStatus = [];

for (const source of sourceConfig.sources) {
  if (source.id === 'skills-sh') {
    for (const query of queries) {
      try {
        const data = await getJson(`https://skills.sh/api/v1/skills/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        for (const item of data.data || []) {
          const normalized = normalizeSkill(item, source, query);
          normalized.score = score(normalized);
          catalog.set(`${normalized.kind}:${normalized.id}`, normalized);
        }
        sourceStatus.push({ source: source.id, query, status: 'ok', count: (data.data || []).length });
      } catch (error) {
        sourceStatus.push({ source: source.id, query, status: 'error', error: error.message });
      }
    }
  }

  if (source.id === 'skillsmp') {
    for (const query of queries) {
      try {
        const data = await getJson(`https://skillsmp.com/api/v1/skills/search?q=${encodeURIComponent(query)}&limit=${limit}&sortBy=stars`);
        const items = data.data?.skills || data.skills || [];
        for (const item of items) {
          const normalized = normalizeSkill(item, source, query);
          normalized.score = score(normalized);
          catalog.set(`${normalized.kind}:${normalized.id}`, normalized);
        }
        sourceStatus.push({ source: source.id, query, status: 'ok', count: items.length });
      } catch (error) {
        sourceStatus.push({ source: source.id, query, status: 'error', error: error.message });
      }
    }
  }

  if (source.id === 'mcp-registry' && includeMcp) {
    try {
      let cursor = '';
      let pages = 0;
      let fetched = 0;
      do {
        const url = `https://registry.modelcontextprotocol.io/v0.1/servers?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const data = await getJson(url);
        for (const item of data.servers || []) {
          const normalized = normalizeMcp(item, source);
          normalized.score = score(normalized);
          catalog.set(`${normalized.kind}:${normalized.id}`, normalized);
          fetched += 1;
        }
        cursor = data.metadata?.nextCursor || '';
        pages += 1;
      } while (cursor && pages < 3);
      sourceStatus.push({ source: source.id, status: 'ok', pages, count: fetched });
    } catch (error) {
      sourceStatus.push({ source: source.id, status: 'error', error: error.message });
    }
  }
}

const ranked = [...catalog.values()]
  .sort((a, b) => b.score - a.score || b.installs - a.installs || a.id.localeCompare(b.id));

const result = {
  version: 1,
  generatedAt: new Date().toISOString(),
  queries,
  ranking: {
    formula: '0.45 relevance + 0.25 popularity + 0.20 source-trust + 0.10 official - duplicate penalty',
    promotionRule: 'ranking is discovery only; security, license, compatibility, behavior and sandbox checks are mandatory before execution'
  },
  policy: {
    discoveryIsNotTrust: true,
    duplicateSkillsExcludedFromPromotion: true,
    securityMustBeRecheckedBeforeExecution: true,
    sourceTrustIsOnlyOneRankingSignal: true,
    sandboxRequiredForExecution: true
  },
  sourceStatus,
  counts: {
    total: ranked.length,
    skills: ranked.filter(x => x.kind === 'skill').length,
    mcp: ranked.filter(x => x.kind === 'mcp').length
  },
  candidates: ranked
};

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, counts: result.counts, successfulSources: sourceStatus.filter(x => x.status === 'ok').length }, null, 2));
