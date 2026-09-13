#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'capability-resolver-'));
await fs.mkdir(path.join(root, '.engineering-update'), { recursive: true });

const catalog = {
  version: 1,
  candidates: [
    { id: 'test/browser', kind: 'mcp', source: 'test', name: 'Browser automation', description: 'Run browser end-to-end tests and verify web applications', text: 'browser automation e2e testing', score: 0.8, sourceTrust: 0.8, official: true, duplicate: false, url: 'https://example.test/browser' },
    { id: 'test/database', kind: 'mcp', source: 'test', name: 'Database tools', description: 'Inspect databases', text: 'database sql', score: 0.7, sourceTrust: 0.8, official: false, duplicate: false, url: 'https://example.test/database' }
  ]
};
const catalogPath = path.join(root, '.engineering-update', 'capability-catalog.json');
await fs.writeFile(catalogPath, JSON.stringify(catalog));

const resolver = path.resolve('scripts/capability-resolver.mjs');
const output = path.join(root, '.engineering-update', 'capability-resolution.json');
const result = spawnSync(process.execPath, [resolver, `--catalog=${catalogPath}`, '--request=browser end to end testing', `--output=${output}`], { encoding: 'utf8' });
if (result.status !== 0) throw new Error(`Resolver failed: ${result.stderr || result.stdout}`);

const report = JSON.parse(await fs.readFile(output, 'utf8'));
if (report.resolution.status !== 'CANDIDATES_FOUND') throw new Error('Resolver did not find candidates.');
if (report.resolution.selected?.id !== 'test/browser') throw new Error('Resolver selected the wrong candidate.');
if (report.resolution.selected?.promotion.executable !== false) throw new Error('Resolver incorrectly trusted a discovery candidate.');
if (!report.resolution.selected?.promotion.blockers.includes('DISCOVERY_ONLY')) throw new Error('Discovery-only safety gate missing.');

async function resolveFixture(name, candidates) {
  const fixtureDir = path.join(root, name);
  await fs.mkdir(fixtureDir, { recursive: true });
  const fixtureCatalog = path.join(fixtureDir, 'catalog.json');
  const fixtureOutput = path.join(fixtureDir, 'resolution.json');
  await fs.writeFile(fixtureCatalog, JSON.stringify({ version: 1, candidates }));
  const run = spawnSync(process.execPath, [resolver, `--catalog=${fixtureCatalog}`, '--request=browser automation testing', `--output=${fixtureOutput}`], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`${name} fixture failed: ${run.stderr || run.stdout}`);
  return JSON.parse(await fs.readFile(fixtureOutput, 'utf8'));
}

const noUrlTopWithUrlFallback = await resolveFixture('no-url-top-with-url-fallback', [
  { id: 'test/no-url-top', kind: 'skill', source: 'test', name: 'Browser automation', description: 'browser automation testing', text: 'browser automation testing', score: 1, sourceTrust: 1, official: true, duplicate: false },
  { id: 'test/url-fallback', kind: 'skill', source: 'test', name: 'Browser automation fallback', description: 'browser automation testing', text: 'browser automation testing', score: 0.8, sourceTrust: 0.8, official: false, duplicate: false, url: 'https://example.test/fallback' }
]);
if (noUrlTopWithUrlFallback.resolution.status !== 'CANDIDATES_FOUND') throw new Error('Resolver rejected a valid URL-bearing fallback.');
if (noUrlTopWithUrlFallback.resolution.selected?.id !== 'test/url-fallback') throw new Error('Resolver selected a candidate without provenance instead of the URL-bearing fallback.');
if (!noUrlTopWithUrlFallback.resolution.alternatives.some((candidate) => candidate.id === 'test/no-url-top')) throw new Error('Resolver did not retain the higher-scoring no-URL candidate as an alternative.');

const noUrlOnly = await resolveFixture('no-url-only', [
  { id: 'test/no-url-a', kind: 'skill', source: 'test', name: 'Browser automation', description: 'browser automation testing', text: 'browser automation testing', score: 1, sourceTrust: 1, official: true, duplicate: false },
  { id: 'test/no-url-b', kind: 'skill', source: 'test', name: 'Browser automation backup', description: 'browser automation testing', text: 'browser automation testing', score: 0.8, sourceTrust: 0.8, official: false, duplicate: false }
]);
if (noUrlOnly.resolution.status !== 'GAP') throw new Error('Resolver must return GAP when no matching candidate has provenance.');
if (noUrlOnly.resolution.selected !== null) throw new Error('Resolver selected an unverifiable candidate in a provenance-only gap.');
if (!noUrlOnly.resolution.gaps.some((gap) => gap.type === 'CAPABILITY_GAP')) throw new Error('Resolver did not emit a capability gap for missing provenance.');

console.log('capability-resolver self-test: PASS');
