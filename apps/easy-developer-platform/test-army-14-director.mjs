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


test('director requires valid SOAT execution evidence when supplied', () => {
  const task = TASKS[0];
  const {run,contract} = buildSoldierRun(task,{commit:'baseline',stateFingerprint:'fp'},0);
  const soatEvidence={
    schema:'soat-execution-evidence/v1',
    verified:true,
    runId:'37361178767',
    commit:'3fd02f490369d7ca184e9a9420845e50252354bc',
    soatSha:'600721c1fa30de27c14f6da5e5917049a5339036',
    evidenceLevel:'runtime',
    scope:'SOAT + API Factory + local Ollama',
    productionStatus:'runtime-verified',
    gates:{
      health:true,
      authentication:true,
      provider_resolved:true,
      api_factory_probe:true,
      real_chat_completion:true,
      official_smoke_suite:true,
    },
  };
  const result={taskId:task.id,status:'VERIFIED',contract,verification:{passed:true,summary:'verified'},evidence:[
    {kind:'baseline'},{kind:'action'},{kind:'verification'},{kind:'result'}
  ],soatEvidence};
  const closed=closeSoldierRun(run,result);
  const persisted=closed.evidence.at(-1);
  assert.equal(closed.state,'completed');
  assert.deepEqual(persisted.soatEvidence,{ok:true,schema:'soat-execution-evidence/v1',runId:'37361178767',commit:'3fd02f490369d7ca184e9a9420845e50252354bc',soatSha:'600721c1fa30de27c14f6da5e5917049a5339036',evidenceLevel:'runtime',scope:'SOAT + API Factory + local Ollama',productionStatus:'runtime-verified'});
});

test('director fails closed on invalid supplied SOAT evidence', () => {
  const task = TASKS[0];
  const {run,contract} = buildSoldierRun(task,{commit:'baseline',stateFingerprint:'fp'},0);
  const result={taskId:task.id,status:'VERIFIED',contract,verification:{passed:true,summary:'verified'},evidence:[
    {kind:'baseline'},{kind:'action'},{kind:'verification'},{kind:'result'}
  ],soatEvidence:{schema:'soat-execution-evidence/v1',verified:true,gates:{health:true}}};
  assert.throws(() => closeSoldierRun(run,result), /soat_evidence_gate_failed/);
});
