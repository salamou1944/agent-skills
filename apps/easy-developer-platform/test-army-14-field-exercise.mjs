import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runArmy14 } from './army-14-practical-runner.mjs';

test('ARMY-14 integrated field exercise executes all 14 soldier systems with verified pipeline handoffs', async () => {
  const manifest = await runArmy14('MONY revenue-engine end-to-end field exercise', {
    runId: `test-${Date.now()}`,
  });

  assert.equal(manifest.status, 'PIPELINE_VERIFIED');
  assert.equal(manifest.mode, 'integrated-army-14-practical');
  assert.equal(manifest.soldierCount, 14);
  assert.equal(manifest.allSoldiersExecuted, true);
  assert.equal(manifest.allHandoffsVerified, true);
  assert.equal(manifest.allRoleChecksPassed, true);
  assert.equal(manifest.allSoldierContractsVerified, true);
  assert.equal(manifest.taskVerified, false);
  assert.equal(manifest.providerAccess, 'not-required-for-pipeline-gate');
  assert.equal(manifest.revenue, 'not-claimed');
  assert.equal(manifest.chain.length, 14);
  assert.equal(new Set(manifest.chain.map((item) => item.soldier)).size, 14);
  assert.ok(manifest.chain.every((item) => item.pipelineVerified === true));
  assert.ok(manifest.chain.every((item) => item.taskVerified === false));

  const persisted = JSON.parse(await readFile(join(manifest.outputDirectory, 'manifest.json'), 'utf8'));
  assert.deepEqual(persisted, manifest);
});
