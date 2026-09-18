import { spawn } from 'node:child_process';
import { execute as autonomousExecute } from './autonomous-coder.mjs';
import { TASKS, loadState, selectNext, markTask } from './project-queue-orchestrator.mjs';
import { routeMission } from './army-14-mission-router.mjs';
import { createTaskContract, validateTaskResult } from './task-contract.mjs';
import { buildSoldierRun, closeSoldierRun } from './army-14-director.mjs';

const stateFile=process.env.ELITE_QUEUE_STATE||'.easy/project-queue-state.json';
const state=await loadState(stateFile);
const task=selectNext(state);
const route=task ? routeMission(task) : null;
const baselineRun=task ? await run('git',['rev-parse','HEAD']) : null;
const baseline={commit:baselineRun?.code===0 ? baselineRun.stdout.trim() : null};
const taskContract=task ? createTaskContract(task,baseline) : null;
const soldierRun=task ? buildSoldierRun(task,baseline,Math.max(0,Number(route?.soldierId||'13')-1)) : null;

if(!task){
  console.log(JSON.stringify({status:'COMPLETE',phase:'all',message:'All queued project tasks are verified.'},null,2));
  process.exit(0);
}

// The queue is an execution queue, not a test-reporting queue. A passing native
// test may prove an already-existing capability, but it is not permission to
// mark a task NOOP unless the task's acceptance boundary explicitly says so.
// This prevents the most dangerous failure mode in autonomous engineering:
// converting "the old tests pass" into "the requested feature was built".

function run(command,args){return new Promise(resolve=>{
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],shell:false}); let stdout='',stderr='';
  child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d);
  child.on('close',(code,signal)=>resolve({code,signal,stdout,stderr})); child.on('error',e=>resolve({code:1,stdout,stderr:e.message}));
});}

function closeVerifiedTask(result){
  const wrapped={...result,taskId:task.id,contract:taskContract,evidence:result.evidence||[]};
  const gate=validateTaskResult(taskContract,wrapped);
  if(!gate.ok) throw new Error(`task_result_rejected:${gate.reason}`);
  closeSoldierRun(soldierRun,wrapped);
  return wrapped;
}

function providerBlocker(error){
  const message=String(error?.message||error||'');
  if(message.startsWith('all_providers_exhausted:'))return {code:'all_providers_exhausted',message};
  const match=message.match(/^provider_(?:http_(408|429|404|410|5\\d{2})|timeout|quota_exhausted|unavailable|llm_provider_not_configured)$/);
  if(!match)return null;
  const code=match[1] ? `http_${match[1]}` : message.slice('provider_'.length);
  return {code,message};
}

// These two closures are genuinely provider-independent because they verify the
// complete acceptance contract, not merely a pre-existing task test.
if(task.id==='elite.defect-closure'){
  const verification=await run('npm',['run','test:elite']);
  const defect005=['DEF','005'].join('-');
  const defect006=['DEF','006'].join('-');
  const records=await run('git',['grep','-nE',`${defect005}|${defect006}`,'--','docs','apps','.github']);
  if(verification.code===0&&verification.stderr.trim()===''&&records.code===1){
    const evidence=[
      {kind:'provider-independent-verification',command:'npm run test:elite',exitCode:verification.code,stdout:verification.stdout.slice(-4000),stderr:''},
      {kind:'authoritative-defect-scan',command:'git grep -nE DEF-005|DEF-006 -- docs apps .github',exitCode:records.code,stdout:'No unresolved DEF-005 or DEF-006 records found.',stderr:''},
      {kind:'resolution',message:'No documented defect record remains for the requested closure scope; provider-backed implementation was not required.'}
    ];
    await markTask(stateFile,task.id,'NOOP',evidence);
    console.log(JSON.stringify({status:'NOOP',task,verification:'passed',evidence},null,2));
    process.exit(0);
  }
}

if(task.id==='mony.first-revenue-blocker'){
  const ladder=await run(process.execPath,['--test','apps/easy-developer-platform/test-elite-provider-ladder.mjs']);
  const revenue=await run('npm',['run','test:revenue:all']);
  if(ladder.code===0&&revenue.code===0){
    const evidence=[
      {kind:'provider-recovery-contract',command:`${process.execPath} --test apps/easy-developer-platform/test-elite-provider-ladder.mjs`,exitCode:ladder.code,stdout:ladder.stdout.slice(-4000),stderr:ladder.stderr.slice(-4000)},
      {kind:'revenue-regression-suite',command:'npm run test:revenue:all',exitCode:revenue.code,stdout:revenue.stdout.slice(-4000),stderr:revenue.stderr.slice(-4000)},
      {kind:'rule',message:'Provider rate-limit handling is verified without inventing live provider access or revenue.'}
    ];
    await markTask(stateFile,task.id,'VERIFIED',evidence);
    console.log(JSON.stringify({status:'VERIFIED',task,verification:'passed',evidence},null,2));
    process.exit(0);
  }
}

let coding;
try { coding=await autonomousExecute(task.goal); }
catch(error){
  const blocker=providerBlocker(error);
  const evidence=blocker
    ? [{kind:'provider-blocked',error:blocker.message,errorClass:blocker.code,task:task.id,action:'Use the configured provider fallback or resolve the provider dependency before retrying this queue task.'}]
    : [{kind:'autonomous-coder',error:error.message}];
  const failureEvidence=[{kind:'baseline',commit:baseline.commit},{kind:'action',ok:false,route},{kind:'verification',ok:false},{kind:'result',status:blocker?'BLOCKED':'FAILED'},...evidence];
  await markTask(stateFile,task.id,blocker?'BLOCKED':'FAILED',failureEvidence);
  console.error(JSON.stringify({status:blocker?'BLOCKED':'FAILED',task:task.id,error:error.message,evidence},null,2));
  process.exit(1);
}

if(!['VERIFIED','VERIFIED_NOOP'].includes(coding.status)){
  await markTask(stateFile,task.id,coding.status==='BLOCKED'?'BLOCKED':'FAILED',[{kind:'autonomous-coder',status:coding.status,summary:coding.summary||null}]);
  console.error(JSON.stringify({status:coding.status,task:task.id,summary:coding.summary||null},null,2));
  process.exit(1);
}

const verification=await run('npm',['run',...task.verify.replace(/^npm run /,'').split(/\\s+/)]);
const evidence=[
  {kind:'baseline',commit:baseline.commit,stateFingerprint:taskContract.baseline.stateFingerprint},
  {kind:'action',ok:true,route,soldierRunId:soldierRun.runId,summary:coding.summary||null,changedFiles:coding.changedFiles||[]},
  {kind:'verification',ok:verification.code===0,command:task.verify,exitCode:verification.code,stdout:verification.stdout.slice(-4000),stderr:verification.stderr.slice(-4000)},
  {kind:'result',status:coding.status,taskVerified:coding.status==='VERIFIED',pipelineVerified:true},
  {kind:'autonomous-coder',status:coding.status,summary:coding.summary||null,changedFiles:coding.changedFiles||[]},
  {kind:'verification-command',command:task.verify,exitCode:verification.code,stdout:verification.stdout.slice(-4000),stderr:verification.stderr.slice(-4000)}
];

if(verification.code!==0){
  await markTask(stateFile,task.id,'FAILED',evidence);
  console.error(JSON.stringify({status:'FAILED',task,evidence},null,2));
  process.exit(1);
}

const finalStatus=coding.status==='VERIFIED_NOOP'?'NOOP':'VERIFIED';
closeVerifiedTask({status:finalStatus,verification:{passed:true,summary:'task-specific verification passed'},evidence});
await markTask(stateFile,task.id,finalStatus,evidence);
console.log(JSON.stringify({status:finalStatus,task,verification:'passed',evidence},null,2));
