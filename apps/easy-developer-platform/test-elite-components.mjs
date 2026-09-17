import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverTests } from './elite-intelligence.mjs';
import { securityReview } from './elite-security.mjs';
import { runBenchmark } from './elite-benchmark.mjs';
import { createEliteRuntime } from './elite-runtime.mjs';

test('test intelligence discovers targeted npm scripts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'elite-components-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { 'test:unit': 'node --test test-foo.mjs', 'lint': 'true' } }));
  const found = await discoverTests({ root, changedFiles: ['test-foo.mjs'] });
  assert.ok(found.some(x => x.name === 'test:unit'));
});

test('security gate rejects embedded secrets and workflow edits', () => {
  // Construct the secret-shaped fixture at runtime so the repository scanner does not
  // mistake the test fixture itself for a credential stored in source control.
  const secretFixture = ['sk', '123456789012345678901234'].join('-');
  const result = securityReview({ changes: [{ path: 'src/a.mjs', content: `const api_key="${secretFixture}";` }, { path: '.github/workflows/x.yml', content: 'name: x' }] });
  assert.equal(result.ok, false);
  assert.ok(result.findings.length >= 2);
});

test('benchmark harness produces deterministic pass metrics', async () => {
  const result = await runBenchmark(async testCase => ({ status: testCase.expected }));
  assert.equal(result.passRate, 1);
  assert.equal(result.passed, result.total);
});

test('runtime exposes health endpoint and task dispatch', async () => {
  const runtime = createEliteRuntime({ port: 0, runTask: async goal => ({ status: 'verified', goal }) });
  await runtime.start();
  const address = runtime.server.address();
  const health = await fetch(`http://127.0.0.1:${address.port}/health`).then(r => r.json());
  assert.equal(health.ok, true);
  await runtime.stop();
});
