import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const ROOT = process.cwd();
const SOLDIERS = [
  '01-architect','02-builder','03-ui-ux','04-backend-api','05-database',
  '06-security','07-integration','08-ai-agent','09-test-qa','10-browser-e2e',
  '11-debug-repair','12-deployment-ops','13-product-mvp','14-research-capability',
];

const TARGETS = Object.freeze({
  EASY: ['npm','run','test:elite'],
  MONY: ['npm','run','test:mony'],
});

function run(command, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { cwd: ROOT, env: process.env, stdio: ['ignore','pipe','pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ ...result, durationMs: Date.now() - started, stdout, stderr });
    };
    child.stdout.on('data', (x) => { stdout += x; });
    child.stderr.on('data', (x) => { stderr += x; });
    child.on('error', (error) => finish({ ok:false, code:null, error:error.message }));
    child.on('close', (code) => finish({ ok: code === 0, code }));
    setTimeout(() => {
      child.kill('SIGTERM');
      finish({ ok:false, code:null, error:'timeout' });
    }, timeoutMs);
  });
}

function resultFor(target, soldier, mutation, runResult) {
  return {
    target, soldier, mutation,
    ok: runResult.ok,
    score: runResult.ok ? 1 : 0,
    durationMs: runResult.durationMs,
    exitCode: runResult.code,
    error: runResult.error ?? null,
    stdout: runResult.stdout.slice(-12000),
    stderr: runResult.stderr.slice(-12000),
  };
}

async function main() {
  const mutation = process.env.LAB_MUTATION ?? 'control-baseline';
  const results = [];
  for (const [target, command] of Object.entries(TARGETS)) {
    for (const soldier of SOLDIERS) {
      const runResult = await run(command[0], command.slice(1));
      results.push(resultFor(target, soldier, mutation, runResult));
    }
  }

  const total = results.length;
  const passed = results.filter((x) => x.ok).length;
  const report = {
    schema: 'army14-evolution-lab/v1',
    generatedAt: new Date().toISOString(),
    mutation,
    totalExperiments: total,
    passedExperiments: passed,
    passRate: total ? passed / total : 0,
    verdict: passed === total ? 'CONTROL_VERIFIED' : 'CONTROL_FAILED',
    promotion: 'BLOCKED',
    reason: 'A control run is not evidence that a mutation is beneficial. Mutation promotion requires a separate candidate run and independent verification.',
    results,
  };

  await mkdir('.lab/results', { recursive: true });
  await writeFile('.lab/results/latest.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    schema: report.schema,
    mutation: report.mutation,
    totalExperiments: report.totalExperiments,
    passedExperiments: report.passedExperiments,
    passRate: report.passRate,
    verdict: report.verdict,
    promotion: report.promotion,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
