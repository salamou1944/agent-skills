#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const evaluator = path.join(root, 'scripts/capability-sandbox-eval.mjs');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'capability-sandbox-self-test-'));

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [evaluator, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (x) => { stdout += x; });
    child.stderr.on('data', (x) => { stderr += x; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

try {
  const resolution = path.join(temp, 'resolution.json');
  const output = path.join(temp, 'evaluation.json');
  await fs.writeFile(resolution, JSON.stringify({
    resolution: {
      selected: {
        id: 'fixture.safe-capability',
        source: 'fixture',
        name: 'Safe Fixture',
        description: 'safe deterministic test capability',
        url: 'https://example.invalid/fixture',
        promotion: { blockers: ['DISCOVERY_ONLY'] }
      }
    }
  }));

  const safe = await run([`--resolution=${resolution}`, `--output=${output}`, '--command=printf sandbox-ok']);
  if (safe.code !== 0) throw new Error(`safe evaluation failed: ${safe.stdout}\n${safe.stderr}`);
  const safeResult = JSON.parse(await fs.readFile(output, 'utf8'));
  if (safeResult.verdict !== 'READY_FOR_EVALUATION') throw new Error(`unexpected safe verdict: ${safeResult.verdict}`);
  if (!safeResult.isolation || safeResult.isolation.secretsExposed !== false || safeResult.isolation.networkAccess !== 'not-guaranteed-by-this-layer') {
    throw new Error('sandbox isolation contract missing');
  }
  if (safeResult.isolation.remoteCodeAutoExecution !== false) {
    throw new Error('remote code auto-execution policy missing');
  }

  const blocked = await run([`--resolution=${resolution}`, `--output=${output}`, '--command=rm -rf /']);
  if (blocked.code !== 2) throw new Error(`unsafe command was not blocked: ${blocked.stdout}`);
  const blockedResult = JSON.parse(await fs.readFile(output, 'utf8'));
  if (blockedResult.verdict !== 'NOT_READY') throw new Error(`unexpected blocked verdict: ${blockedResult.verdict}`);
  if (!blockedResult.checks.some((check) => check.name === 'explicit-command-policy' && check.status === 'FAIL')) {
    throw new Error('blocked-command evidence missing');
  }

  console.log('capability-sandbox-eval self-test: PASS');
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
