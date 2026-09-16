#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return `ERROR: ${error.stderr?.trim() || error.message}`;
  }
};

const files = ['package.json', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb'];
const packageFile = files.find((file) => existsSync(join(root, file)));
const pkg = existsSync(join(root, 'package.json'))
  ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  : {};

const report = {
  generatedAt: new Date().toISOString(),
  branch: run('git', ['branch', '--show-current']),
  head: run('git', ['rev-parse', 'HEAD']),
  workingTree: run('git', ['status', '--short']),
  packageManagerFile: packageFile,
  scripts: pkg.scripts ?? {},
  checks: {},
};

for (const [name, script] of Object.entries(pkg.scripts ?? {})) {
  if (!['test', 'typecheck', 'lint', 'build'].includes(name)) continue;
  report.checks[name] = { command: `${packageFile?.startsWith('pnpm') ? 'pnpm' : packageFile?.startsWith('yarn') ? 'yarn' : packageFile?.startsWith('bun') ? 'bun' : 'npm'} run ${name}` };
}

const output = join(root, 'supervisor-progress.json');
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
