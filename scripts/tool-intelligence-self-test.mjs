import fs from 'node:fs';
import assert from 'node:assert/strict';

const registry = JSON.parse(fs.readFileSync('tools/registry.json', 'utf8'));
const deficits = JSON.parse(fs.readFileSync('tools/deficits.json', 'utf8'));
const readme = fs.readFileSync('tools/README.md', 'utf8');
const factory = fs.readFileSync('tools/tool-factory-contract.md', 'utf8');

assert.equal(registry.schemaVersion, 1);
assert.ok(registry.candidates.length >= 5);
for (const tool of registry.candidates) {
  assert.ok(tool.id && tool.source && tool.capability && tool.status);
}
assert.ok(deficits.deficits.length >= 1);
assert.ok(readme.includes('discover -> score -> inspect -> adapt -> self-test'));
assert.ok(factory.includes('Fail-closed rule'));
assert.ok(factory.includes('Security tests'));

console.log(`tool intelligence self-test: PASS (${registry.candidates.length} candidates, ${deficits.deficits.length} deficits)`);
