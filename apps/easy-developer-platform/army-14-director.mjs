import { SOLDIER_SYSTEMS, createSoldierRun, transitionSoldierRun, verifySoldierSystem } from './soldier-systems/army-14-systems.mjs';
import { createTaskContract, validateTaskResult } from './task-contract.mjs';

const ASSIGNMENTS = Object.freeze([
  ['01','architect'],['02','builder'],['03','ui-ux'],['04','backend-api'],['05','database'],['06','security'],
  ['07','integration'],['08','ai-agent'],['09','test-qa'],['10','browser-e2e'],['11','debug-repair'],
  ['12','deployment-ops'],['13','product-mvp'],['14','research-capability'],
]);

export function assignSoldier(task, index = 0) {
  if (!task?.id) throw new Error('assignment_task_invalid');
  const [id,name] = ASSIGNMENTS[index % ASSIGNMENTS.length];
  const soldier = SOLDIER_SYSTEMS.find(s => s.id === id);
  return { taskId:task.id, soldierId:id, soldier:name, domain:soldier.domain };
}

export function assignSoldierById(task, soldierId) {
  if (!task?.id) throw new Error('assignment_task_invalid');
  const id = String(soldierId || '');
  const soldier = SOLDIER_SYSTEMS.find(s => s.id === id);
  if (!soldier) throw new Error('assignment_soldier_invalid');
  return { taskId:task.id, soldierId:soldier.id, soldier:soldier.name, domain:soldier.domain };
}

export function buildSoldierRun(task, baseline, assignmentOrIndex = 0) {
  const assignment = typeof assignmentOrIndex === 'object'
    ? assignSoldierById(task, assignmentOrIndex.soldierId)
    : assignSoldier(task, assignmentOrIndex);
  const contract = createTaskContract(task, baseline);
  let run = createSoldierRun({ soldierId:assignment.soldierId, taskId:task.id, input:{ goal:task.goal, contract } });
  run = transitionSoldierRun(run,'executing',{kind:'action',ok:true,action:'assigned-and-started',soldier:assignment.soldier});
  return { assignment, contract, run };
}

export function closeSoldierRun(run, result) {
  const gate = validateTaskResult(result.contract ?? run.input?.contract, result);
  if (!gate.ok) throw new Error(`task_result_rejected:${gate.reason}`);
  let current = run;
  if (current.state === 'executing') current = transitionSoldierRun(current,'verifying',{kind:'verification',ok:result.verification?.passed === true,summary:result.verification?.summary ?? null});
  if (result.status === 'VERIFIED') {
    current = transitionSoldierRun(current,'completed',{kind:'result',ok:true,status:result.status});
    if (!verifySoldierSystem(current)) throw new Error('soldier_verification_incomplete');
    return current;
  }
  if (result.status === 'BLOCKED') return transitionSoldierRun(current,'blocked',{kind:'result',ok:false,reason:'blocked-with-evidence'});
  if (result.status === 'FAILED') return transitionSoldierRun(current,'recovering',{kind:'result',ok:false,reason:'failed-with-recovery-path'});
  return transitionSoldierRun(current,'completed',{kind:'result',ok:true,status:result.status});
}

export function directorSnapshot() {
  return { version:'army-14-director-v1', soldierCount:SOLDIER_SYSTEMS.length, assignments:ASSIGNMENTS.map(([id,name])=>({id,name})) };
}
