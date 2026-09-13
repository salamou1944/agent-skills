import fs from 'node:fs';
import assert from 'node:assert/strict';

const registry = JSON.parse(fs.readFileSync('tools/registry.json', 'utf8'));
const deficits = JSON.parse(fs.readFileSync('tools/deficits.json', 'utf8'));
const readme = fs.readFileSync('tools/README.md', 'utf8');
const factory = fs.readFileSync('tools/tool-factory-contract.md', 'utf8');

assert.equal(registry.schemaVersion, 2, 'registry must use schemaVersion 2');
assert.equal(registry.selection?.minimumTrust, 'A');
assert.ok(Array.isArray(registry.selection?.requiredEvidence));
assert.ok(registry.selection.requiredEvidence.length >= 5);
assert.ok(Array.isArray(registry.candidates));
assert.ok(registry.candidates.length >= 5);

for (const tool of registry.candidates) {
  assert.ok(tool.id && tool.source && tool.capability && tool.status);
  assert.ok(['candidate', 'accepted', 'rejected', 'deferred'].includes(tool.status));
  assert.ok(['A', 'B', 'C'].includes(tool.trust));
  assert.ok(tool.evidence && typeof tool.evidence === 'object');
  for (const evidenceKey of registry.selection.requiredEvidence) {
    assert.equal(typeof tool.evidence[evidenceKey], 'boolean', `${tool.id}: missing evidence flag ${evidenceKey}`);
  }
}

assert.ok(Array.isArray(deficits.deficits));
assert.ok(deficits.deficits.length >= 1);
for (const deficit of deficits.deficits) {
  assert.ok(deficit.id && deficit.capability && deficit.severity && deficit.status);
  assert.ok(['open', 'closed'].includes(deficit.status));
  if (deficit.status === 'open') assert.ok(deficit.nextAction, `${deficit.id}: open deficit needs nextAction`);
}

assert.ok(readme.includes('discover -> score -> inspect -> adapt -> self-test -> integration-test -> promote -> monitor -> retire'));
assert.ok(factory.includes('Fail-closed rule'));
assert.ok(factory.includes('Security tests'));
assert.ok(factory.includes('Integration smoke test'));
assert.ok(factory.includes('observed failure -> deficit'));

console.log(`tool intelligence self-test: PASS (${registry.candidates.length} candidates, ${deficits.deficits.length} deficits)`);
