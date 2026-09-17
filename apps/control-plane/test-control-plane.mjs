import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry, validateRegistry, authorize, createTask, health } from './control-plane.mjs';

const registry = await loadRegistry();

test('registry contains only distinct project repositories', () => {
  assert.equal(validateRegistry(registry), true);
  const repos = Object.values(registry.projects).map((project) => project.repository);
  assert.equal(new Set(repos).size, repos.length);
});

test('safe actions are authorized per project', () => {
  const result = authorize(registry, 'Easy-', 'read', { connectorAvailable: true });
  assert.deepEqual(result, { ok: true, project: 'Easy-', repository: 'salamou1944/Easy-', action: 'read' });
});

test('unknown projects fail closed', () => {
  assert.equal(authorize(registry, 'unknown', 'read').ok, false);
  assert.equal(authorize(registry, 'unknown', 'read').reason, 'unknown_project');
});

test('missing connectors fail closed', () => {
  const result = authorize(registry, 'Salamou-31', 'read', { connectorAvailable: false });
  assert.deepEqual(result, { ok: false, reason: 'connector_unavailable' });
});

test('writes cannot bypass pull-request policy', () => {
  for (const action of ['write', 'merge', 'deploy', 'delete', 'rotate-secret', 'production-mutation']) {
    assert.equal(authorize(registry, 'agent-skills', action, { approved: true }).ok, false, action);
  }
});

test('tasks never grant completion claims automatically', () => {
  const task = createTask(registry, 'AI_operating_memory', 'verify canonical state', { action: 'verify' });
  assert.equal(task.status, 'READY');
  assert.equal(task.evidenceRequired, true);
  assert.equal(task.completionClaimAllowed, false);
});

test('health exposes the four project boundaries', async () => {
  const value = await health();
  assert.equal(value.status, 'READY');
  assert.deepEqual(value.projects, ['agent-skills', 'Salamou-31', 'Easy-', 'AI_operating_memory']);
});
