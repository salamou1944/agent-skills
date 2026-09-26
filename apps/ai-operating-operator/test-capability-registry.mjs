import assert from 'node:assert/strict';
import { createTask, assessCapabilities, authorizeAction, verifyCompletion } from './operator-core.mjs';

const task = createTask({
  project: 'agent-skills',
  goal: 'security capability smoke test',
  requestedCapabilities: ['security.network.nmap']
});
const unavailable = assessCapabilities(task, {
  'security.network.nmap': { authorized: true, reachable: false, canRead: true, canWrite: false, canDeploy: false }
});
assert.equal(unavailable.ok, false);
assert.equal(unavailable.results[0].status, 'BLOCKED_EXTERNAL_DEPENDENCY');

const available = assessCapabilities(task, {
  'security.network.nmap': { authorized: true, reachable: true, canRead: true, canWrite: false, canDeploy: false }
});
assert.equal(available.ok, true);
assert.equal(authorizeAction(task, 'read', available.results[0]).ok, true);

const incomplete = verifyCompletion(task, {
  taskId: task.taskId,
  state: 'EVIDENCE_CAPTURED',
  verification: { passed: true },
  evidence: [
    { kind: 'action' },
    { kind: 'verification' }
  ]
});
assert.equal(incomplete.ok, false);
assert.ok(incomplete.errors.includes('independent_verifier_missing'));

console.log('ai-operating-operator capability smoke tests: PASS');
