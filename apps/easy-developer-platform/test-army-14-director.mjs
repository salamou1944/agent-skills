import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS } from './project-queue-orchestrator.mjs';
import { buildSoldierRun, closeSoldierRun, directorSnapshot } from './army-14-director.mjs';

test('director assigns every task to a bounded soldier system', () => {
  assert.equal(directorSnapshot().soldierCount,14);
  const seen = new Set();
  TASKS.forEach((task,i) => seen.add(buildSoldierRun(task,{commit:'baseline',stateFingerprint:'fp'},i).assignment.soldierId));
  assert.equal(seen.size,14);
});

test('director refuses completion without evidence', () => {
  const task = TASKS[0];
  const {run,contract} = buildSoldierRun(task,{commit:'baseline',stateFingerprint:'fp'},0);
  assert.throws(() => closeSoldierRun(run,{taskId:task.id,status:'VERIFIED',contract,evidence:[{kind:'baseline'}],verification:{passed:false}}), /task_result_rejected|soldier/);
});

test('director closes a fully evidenced task', () => {
  const task = TASKS[0];
  const {run,contract} = buildSoldierRun(task,{commit:'baseline',stateFingerprint:'fp'},0);
  const result={taskId:task.id,status:'VERIFIED',contract,verification:{passed:true,summary:'verified'},evidence:[
    {kind:'baseline'},{kind:'action'},{kind:'verification'},{kind:'result'}
  ]};
  const closed=closeSoldierRun(run,result);
  assert.equal(closed.state,'completed');
});
