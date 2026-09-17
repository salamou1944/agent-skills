import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runArmy14 } from './army-14-practical-runner.mjs';

test('ARMY-14 integrated field exercise executes all 14 soldiers with verified handoffs', async () => {
  const manifest = await runArmy14('MONY revenue-engine end-to-end field exercise', {
    runId: `test-${Date.now()}`,
  });

  assert.equal(manifest.status, 'VERIFIED');
  assert.equal(manifest.mode, 'integrated-army-14-practical');
  assert.equal(manifest.soldierCount, 14);
  assert.equal(manifest.allSoldiersExecuted, true);
  assert.equal(manifest.allHandoffsVerified, true);
  assert.equal(manifest.chain.length, 14);
  assert.equal(new Set(manifest.chain.map((item) => item.soldier)).size, 14);
  assert.equal(manifest.claims.providerAccess, 'not-claimed');
  assert.equal(manifest.claims.revenue, 'not-claimed');

  const persisted = JSON.parse(await readFile(join(manifest.outputDirectory, 'manifest.json'), 'utf8'));
  assert.deepEqual(persisted, manifest);
});
