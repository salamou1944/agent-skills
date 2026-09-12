#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-update-'));
fs.mkdirSync(path.join(root, 'src'), { recursive: true });
fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', scripts: { test: 'node tests/basic.mjs' } }, null, 2));
fs.writeFileSync(path.join(root, 'src', 'index.js'), 'export const answer = 42;\n');
fs.writeFileSync(path.join(root, 'tests', 'basic.mjs'), 'console.log("ok");\n');

const runner = path.resolve('scripts/engineering-update.mjs');
const result = spawnSync(process.execPath, [runner, `--root=${root}`], { encoding: 'utf8' });
if (result.status !== 2) {
  console.error(result.stdout);
  console.error(result.stderr);
  throw new Error(`Expected snapshot-only runner to exit 2, got ${result.status}`);
}
const report = JSON.parse(fs.readFileSync(path.join(root, '.engineering-update', 'verification-result.json'), 'utf8'));
if (report.verdict !== 'NOT_READY') throw new Error('Runner incorrectly promoted a plan without implementation evidence.');
if (!report.blockingFindings.some((f) => f.id === 'NO_CHANGE_REQUEST')) throw new Error('Missing change-request safety gate.');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, '.engineering-update', 'repository-snapshot.json'), 'utf8'));
if (snapshot.structure.testFileCount < 1) throw new Error('Repository test discovery failed.');
console.log('engineering-update self-test: PASS');
