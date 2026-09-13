import assert from 'node:assert/strict';
import { loadRegistry, discoverTools, selectTool } from '../tools/tool-registry.mjs';
import { admitTool } from '../tools/tool-admission.mjs';
import { buildToolPackage } from '../tools/tool-factory.mjs';

const registry = loadRegistry();
assert.equal(registry.schemaVersion, 2);
assert.ok(registry.candidates.length >= 8);

const discovery = discoverTools(registry, 'git');
assert.ok(discovery.length >= 1);
assert.equal(discovery[0].candidate.id, 'mcp-git');
assert.equal(selectTool(registry, 'git'), null, 'unpromoted candidates must not execute');

const valid = admitTool({
  id: 'test-tool', name: 'Test Tool', capability: 'test', version: '1.0.0',
  source: { url: 'https://example.invalid/tool', verified: true },
  license: { spdx: 'MIT' }, risk: 'low', permissions: [], entrypoint: 'adapter.mjs'
});
assert.equal(valid.admitted, true);

const sensitive = admitTool({
  id: 'write-tool', name: 'Write Tool', capability: 'write', version: '1.0.0',
  source: { url: 'https://example.invalid/tool', verified: true },
  license: { spdx: 'MIT' }, risk: 'medium', permissions: ['write'], entrypoint: 'adapter.mjs'
});
assert.equal(sensitive.admitted, false);
assert.ok(sensitive.errors.includes('approval:required-for-sensitive-permissions'));

const packageResult = buildToolPackage({ id: 'demo-tool', capability: 'demo', description: 'deterministic factory test' });
assert.equal(packageResult.manifest.id, 'demo-tool');
assert.ok(packageResult.files['tools/generated/demo-tool/adapter.mjs']);
assert.ok(packageResult.files['tools/generated/demo-tool/self-test.mjs']);
assert.ok(packageResult.files['tools/generated/demo-tool/EVIDENCE.md']);

console.log('tool system self-test: PASS');
