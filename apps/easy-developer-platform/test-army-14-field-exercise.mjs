import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runArmy14 } from './army-14-practical-runner.mjs';

test('ARMY-14 rejects traversal run IDs before creating evidence paths', async () => {
  await assert.rejects(() => runArmy14('security regression', { runId: '../escape' }), /army14_run_id_invalid/);
  await assert.rejects(() => runArmy14('security regression', { runId: 'a/../b' }), /army14_run_id_invalid/);
});

test('ARMY-14 integrated field exercise verifies the pipeline without conflating it with task completion', async () => {
  const manifest = await runArmy14('MONY revenue-engine end-to-end field exercise', {
    runId: `test-${Date.now()}`,
  });

  assert.equal(manifest.status, 'PIPELINE_VERIFIED');
  assert.equal(manifest.mode, 'integrated-army-14-practical');
  assert.equal(manifest.soldierCount, 14);
  assert.equal(manifest.allSoldiersExecuted, true);
  assert.equal(manifest.allHandoffsVerified, true);
  assert.equal(manifest.allRoleChecksPassed, true);
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
