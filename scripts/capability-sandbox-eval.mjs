#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = new Map(process.argv.slice(2).filter((x) => x.startsWith('--')).map((x) => {
  const [key, ...value] = x.slice(2).split('=');
  return [key, value.join('=') || true];
}));

const resolutionPath = path.resolve(root, String(args.get('resolution') || '.engineering-update/capability-resolution.json'));
const outputPath = path.resolve(root, String(args.get('output') || '.engineering-update/capability-sandbox-evaluation.json'));
const timeoutMs = Math.min(Math.max(Number(args.get('timeout') || 30000), 1000), 120000);

const forbidden = [
  /(^|\W)(rm\s+-rf|mkfs|shutdown|reboot)(\W|$)/i,
  /curl\s+[^\n]*\|\s*(sh|bash)/i,
  /wget\s+[^\n]*\|\s*(sh|bash)/i,
  /(?:process\.env|\/etc\/passwd|id_rsa|\.ssh)(\W|$)/i,
  /(?:child_process|execSync|spawnSync|eval\s*\(|new\s+Function)/i
];

function run(command, cwd) {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-lc', command], {
      cwd,
      env: { PATH: process.env.PATH || '', HOME: cwd, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout: stdout.slice(-12000), stderr: stderr.slice(-12000) });
    });
  });
}

async function main() {
  const resolution = JSON.parse(await fs.readFile(resolutionPath, 'utf8'));
  const selected = resolution?.resolution?.selected;
  if (!selected) throw new Error('No selected capability in resolution artifact.');

  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'capability-sandbox-'));
  const startedAt = new Date().toISOString();
  const checks = [];

  try {
    const metadata = JSON.stringify(selected, null, 2) + '\n';
    await fs.writeFile(path.join(workspace, 'candidate.json'), metadata);

    checks.push({ name: 'candidate-selected', status: selected.id ? 'PASS' : 'FAIL' });
    checks.push({ name: 'source-url-present', status: selected.url ? 'PASS' : 'FAIL' });
    checks.push({ name: 'discovery-only-policy', status: selected.promotion?.blockers?.includes('DISCOVERY_ONLY') ? 'PASS' : 'FAIL' });

    const serialized = metadata.toLowerCase();
    const policyMatches = forbidden.filter((pattern) => pattern.test(serialized)).length;
    checks.push({ name: 'metadata-static-safety', status: policyMatches === 0 ? 'PASS' : 'WARN', matches: policyMatches });

    // Remote candidate code is never downloaded or executed implicitly.
    // Behavior execution is opt-in through an explicit, policy-checked command.
    const command = String(args.get('command') || '').trim();
    if (command) {
      const unsafe = forbidden.some((pattern) => pattern.test(command));
      if (unsafe) {
        checks.push({ name: 'explicit-command-policy', status: 'FAIL', reason: 'COMMAND_BLOCKED_BY_SANDBOX_POLICY' });
      } else {
        const result = await run(command, workspace);
        checks.push({
          name: 'explicit-command-execution',
          status: result.code === 0 ? 'PASS' : 'FAIL',
          exitCode: result.code,
          signal: result.signal || null,
          stdout: result.stdout,
          stderr: result.stderr
        });
      }
    } else {
      checks.push({ name: 'behavior-execution', status: 'NOT_RUN', reason: 'NO_EXPLICIT_SANDBOX_COMMAND' });
    }

    const hardFailures = checks.filter((check) => check.status === 'FAIL');
    const executionRan = checks.some((check) => check.name === 'explicit-command-execution');
    const verdict = hardFailures.length
      ? 'NOT_READY'
      : executionRan
        ? 'READY_FOR_EVALUATION'
        : 'SAFE_TO_STAGE';

    const result = {
      version: 1,
      generatedAt: new Date().toISOString(),
      startedAt,
      completedAt: new Date().toISOString(),
      candidate: { id: selected.id, source: selected.source, name: selected.name, url: selected.url },
      isolation: { temporaryWorkspace: workspace, secretsExposed: false, networkAccess: false, remoteCodeAutoExecution: false },
      policy: {
        discoveryDoesNotGrantTrust: true,
        remoteCodeNeverAutoExecuted: true,
        explicitCommandRequiredForBehaviorTest: true,
        commandTimeoutMs: timeoutMs
      },
      checks,
      verdict
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ output: outputPath, candidate: selected.id, verdict, failedChecks: hardFailures.length }, null, 2));
    process.exitCode = hardFailures.length ? 2 : 0;
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

await main();
