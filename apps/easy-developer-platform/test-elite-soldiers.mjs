import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dir = '.github/agents';
const files = (await readdir(dir)).filter((name) => /^\d{2}-.*-soldier\.agent\.md$/.test(name)).sort();
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

assert.deepEqual(files, expected, 'soldier roster must contain exactly the canonical 14 soldiers');

const requiredTerms = [
  'Elite capability contract',
  'Advanced upgrade',
  'verification',
  'failure',
  'recovery',
  'evidence',
  'block completion',
];

for (const file of files) {
  const text = await readFile(`${dir}/${file}`, 'utf8');
  const lower = text.toLowerCase();
  for (const term of requiredTerms) {
    assert.ok(lower.includes(term.toLowerCase()), `${file} missing required capability term: ${term}`);
  }
}

console.log(JSON.stringify({ ok: true, soldierCount: files.length, soldiers: files }));
