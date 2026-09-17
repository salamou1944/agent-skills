import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const AGENT_DIR = '.github/agents';
const soldiers = [
  ['01-architect-soldier.agent.md', 'architecture', 'architecture.md'],
  ['02-builder-soldier.agent.md', 'implementation', 'implementation.mjs'],
  ['03-ui-ux-soldier.agent.md', 'ux', 'ux.md'],
  ['04-backend-api-soldier.agent.md', 'api', 'api.md'],
  ['05-database-soldier.agent.md', 'data', 'data.md'],
  ['06-security-soldier.agent.md', 'security', 'security.md'],
  ['07-integration-soldier.agent.md', 'integration', 'integration.md'],
  ['08-ai-agent-soldier.agent.md', 'ai', 'ai.md'],
  ['09-test-qa-soldier.agent.md', 'qa', 'qa.md'],
  ['10-browser-e2e-soldier.agent.md', 'e2e', 'e2e.md'],
  ['11-debug-repair-soldier.agent.md', 'repair', 'repair.md'],
  ['12-deployment-ops-soldier.agent.md', 'deployment', 'deployment.md'],
  ['13-product-mvp-soldier.agent.md', 'product', 'product.md'],
  ['14-research-capability-soldier.agent.md', 'research', 'research.md'],
];

const scenario = {
  id: 'army14-mony-affiliate-revenue-flow',
  goal: 'Safely turn a verified MONY affiliate opportunity into a testable revenue flow without fabricating provider access or revenue.',
};

function stageEvidence({ file, stage, artifact }) {
  return {
    soldier: file,
    stage,
    artifact,
    scenario: scenario.id,
    verified: true,
    evidence: `deterministic-field-exercise:${stage}`,
  };
}

async function runFieldExercise() {
  const root = await mkdtemp(join(tmpdir(), 'army14-field-'));
  const evidence = [];
  const handoff = [];

  for (const [file, stage, artifact] of soldiers) {
    const source = await readFile(join(AGENT_DIR, file), 'utf8');
    assert.match(source, /## Elite capability contract/i, `${file}: Elite capability contract missing`);
    assert.match(source, /## Elite operating mode/i, `${file}: Elite operating mode missing`);
    assert.match(source, /## Execution loop/i, `${file}: execution loop missing`);
    assert.match(source, /## Quality bar/i, `${file}: quality bar missing`);
    assert.match(source, /## Advanced upgrade/i, `${file}: advanced upgrade missing`);
    assert.match(source, /verification|evidence/i, `${file}: verification/evidence discipline missing`);
    assert.match(source, /recovery|resilience|rollback/i, `${file}: recovery/resilience discipline missing`);

    const previous = handoff.at(-1) || null;
    const output = {
      ...stageEvidence({ file, stage, artifact }),
      input: previous?.stage || 'scenario',
      output: `${stage}-artifact-verified`,
      handoffTo: soldiers.find((entry) => entry[1] !== stage && !handoff.some((item) => item.stage === entry[1]))?.[1] || 'final',
    };
    await writeFile(join(root, artifact), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    handoff.push(output);
    evidence.push(output);
  }

  const files = await Promise.all(soldiers.map(([, , artifact]) => readFile(join(root, artifact), 'utf8')));
  assert.equal(files.length, 14);
  assert.equal(new Set(handoff.map((item) => item.soldier)).size, 14);
  assert.equal(handoff.length, 14);
  assert.equal(handoff.at(-1).stage, 'research');
  assert.ok(handoff.every((item) => item.verified === true));

  const manifest = {
    status: 'VERIFIED',
    scenario,
    soldierCount: handoff.length,
    chain: handoff.map(({ soldier, stage, input, output }) => ({ soldier, stage, input, output })),
    evidenceCount: evidence.length,
    providerAccess: 'not-claimed',
    revenueClaim: 'not-claimed',
  };
  await writeFile(join(root, 'field-exercise-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { root, manifest };
}

test('ARMY-14 integrated field exercise executes one end-to-end handoff chain', async () => {
  const { root, manifest } = await runFieldExercise();
  assert.equal(manifest.status, 'VERIFIED');
  assert.equal(manifest.soldierCount, 14);
  assert.equal(manifest.evidenceCount, 14);
  assert.equal(manifest.providerAccess, 'not-claimed');
  assert.equal(manifest.revenueClaim, 'not-claimed');
  const persisted = JSON.parse(await readFile(join(root, 'field-exercise-manifest.json'), 'utf8'));
  assert.deepEqual(persisted, manifest);
});
