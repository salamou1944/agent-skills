import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSubtasks, topologicalSubtasks } from './elite-planner.mjs';

test('planner orders subtasks by dependency and rejects cycles', () => {
  const tasks = normalizeSubtasks({ subtasks: [
    { id: 'b', goal: 'second', dependsOn: ['a'] },
    { id: 'a', goal: 'first', dependsOn: [] }
  ] });
  assert.deepEqual(topologicalSubtasks(tasks).map(x => x.id), ['a', 'b']);
  assert.throws(() => topologicalSubtasks(normalizeSubtasks({ subtasks: [
    { id: 'a', goal: 'a', dependsOn: ['b'] },
    { id: 'b', goal: 'b', dependsOn: ['a'] }
  ] })), /subtask_dependency_cycle/);
});
