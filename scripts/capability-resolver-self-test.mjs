#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fs.mkdtempSync ? await fs.mkdtemp(path.join(os.tmpdir(), 'capability-resolver-')) : path.join(os.tmpdir(), `capability-resolver-${Date.now()}`);
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

console.log('capability-resolver self-test: PASS');
