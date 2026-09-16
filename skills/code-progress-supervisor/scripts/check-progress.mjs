#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const run = (cmd, args) => {
  try {
    return {
      ok: true,
      output: execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output: error.stderr?.trim() || error.stdout?.trim() || error.message,
    };
  }
};

const pkg = existsSync(join(root, 'package.json'))
  ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  : {};

const syntaxTargets = [
  'apps/easy-developer-platform/autonomous-coder.mjs',
  'apps/easy-developer-platform/operator-worker.mjs',
  'apps/easy-developer-platform/operator-api.mjs',
  'apps/easy-developer-platform/ai-operator.mjs',
  'apps/easy-developer-platform/operator-state.mjs',
  'apps/easy-developer-platform/operator-intelligence.mjs',
  'apps/easy-developer-platform/test-elite-code-supervisor.mjs',
  'skills/code-progress-supervisor/scripts/check-progress.mjs',
];

const checks = {};
for (const file of syntaxTargets) {
  const result = run(process.execPath, ['--check', join(root, file)]);
  checks[`syntax:${file}`] = { ok: result.ok, output: result.output };
}

if (pkg.scripts?.['test:elite']) {
  const result = run('npm', ['run', 'test:elite']);
  checks['test:elite'] = { ok: result.ok, output: result.output };
}

const report = {
  generatedAt: new Date().toISOString(),
  branch: run('git', ['branch', '--show-current']).output,
  head: run('git', ['rev-parse', 'HEAD']).output,
  workingTree: run('git', ['status', '--short']).output,
  target: 'Elite Code + Code Progress Supervisor',
  checks,
};

report.ok = Object.values(checks).every((check) => check.ok);

const output = process.env.SUPERVISOR_REPORT_PATH
  ? join(root, process.env.SUPERVISOR_REPORT_PATH)
  : join(root, 'supervisor-progress.json');
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exitCode = 1;
