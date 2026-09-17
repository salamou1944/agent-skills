import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dir = '.github/agents';
const available = (await readdir(dir)).filter((name) => /^\d{2}-.*-soldier\.agent\.md$/.test(name)).sort();
const expected = [
  '01-architect-soldier.agent.md',
  '02-builder-soldier.agent.md',
  '03-ui-ux-soldier.agent.md',
  '04-backend-api-soldier.agent.md',
  '05-database-soldier.agent.md',
  '06-security-soldier.agent.md',
  '07-integration-soldier.agent.md',
  '08-ai-agent-soldier.agent.md',
  '09-test-qa-soldier.agent.md',
  '10-browser-e2e-soldier.agent.md',
  '11-debug-repair-soldier.agent.md',
  '12-deployment-ops-soldier.agent.md',
  '13-product-mvp-soldier.agent.md',
  '14-research-capability-soldier.agent.md',
];

for (const file of expected) {
  assert.ok(available.includes(file), `missing canonical soldier: ${file}`);
}
assert.equal(expected.length, 14, 'canonical roster must contain 14 soldiers');
assert.equal(new Set(expected).size, 14, 'canonical soldier roster must be unique');

for (const file of expected) {
  const text = await readFile(`${dir}/${file}`, 'utf8');
  assert.match(text, /## Elite capability contract/i, `${file} missing Elite capability contract`);
  assert.match(text, /## Elite operating mode/i, `${file} missing Elite operating mode`);
  assert.match(text, /## Execution loop/i, `${file} missing execution loop`);
  assert.match(text, /## Quality bar/i, `${file} missing quality bar`);
  assert.match(text, /## Advanced upgrade/i, `${file} missing advanced upgrade`);
  assert.match(text, /verification|evidence/i, `${file} missing verification/evidence discipline`);
  assert.match(text, /recovery|resilience|rollback/i, `${file} missing recovery/resilience discipline`);
}

console.log(JSON.stringify({ ok: true, canonicalSoldierCount: expected.length, canonicalSoldiers: expected, additionalSoldierFiles: available.filter((name) => !expected.includes(name)) }));
