import { spawn } from 'node:child_process';
import { execute as autonomousExecute } from './autonomous-coder.mjs';
import { TASKS, loadState, selectNext, markTask } from './project-queue-orchestrator.mjs';

const stateFile=process.env.ELITE_QUEUE_STATE||'.easy/project-queue-state.json';
const state=await loadState(stateFile);
const task=selectNext(state);

if(!task){
  console.log(JSON.stringify({status:'COMPLETE',phase:'all',message:'All queued project tasks are verified.'},null,2));
  process.exit(0);
}

if(task.phase!=='mony'){
  console.log(JSON.stringify({status:'HANDOFF_EASY',task},null,2));
  process.exit(0);
}

function run(command,args){return new Promise(resolve=>{
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],shell:false}); let stdout='',stderr='';
  child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d);
  child.on('close',code=>resolve({code,stdout,stderr})); child.on('error',e=>resolve({code:1,stdout,stderr:e.message}));
});}

function providerBlocker(error){
  const message=String(error?.message||error||'');
  if(message.startsWith('all_providers_exhausted:'))return {code:'all_providers_exhausted',message};
  const match=message.match(/^provider_(?:http_(408|429|404|410|5\d{2})|timeout|quota_exhausted|unavailable|llm_provider_not_configured)$/);
  if(!match)return null;
  const code=match[1] ? `http_${match[1]}` : message.slice('provider_'.length);
  return {code,message};
}

// A task-specific passing native test is sufficient for a verified no-op only where
// the test directly exercises that task's acceptance boundary and emits no errors.
// This keeps the loop fail-closed when a chained command masks a sub-check failure.
const preflightSafeNoop=new Set(['mony.product-listing-sales','mony.payment-billing','mony.pipeline','mony.reusable-services','mony.affiliate','mony.market-testing']);
if(preflightSafeNoop.has(task.id)){
  const verification=await run('npm',['run',...task.verify.replace(/^npm run /,'').split(/\s+/)]);
  if(verification.code===0&&verification.stderr.trim()===''){
    const evidence=[{kind:'preflight-native-test',command:task.verify,exitCode:0,stdout:verification.stdout.slice(-4000),stderr:''}];
    await markTask(stateFile,task.id,'NOOP',evidence);
    console.log(JSON.stringify({status:'NOOP',task,verification:'passed',evidence},null,2));
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
  await markTask(stateFile,task.id,blocker?'BLOCKED':'FAILED',evidence);
  console.error(JSON.stringify({status:blocker?'BLOCKED':'FAILED',task:task.id,error:error.message,evidence},null,2));
  process.exit(1);
}

if(!['VERIFIED','VERIFIED_NOOP'].includes(coding.status)){
  await markTask(stateFile,task.id,coding.status==='BLOCKED'?'BLOCKED':'FAILED',[{kind:'autonomous-coder',status:coding.status,summary:coding.summary||null}]);
  console.error(JSON.stringify({status:coding.status,task:task.id,summary:coding.summary||null},null,2));
  process.exit(1);
}

const verification=await run('npm',['run',...task.verify.replace(/^npm run /,'').split(/\s+/)]);
const evidence=[
  {kind:'autonomous-coder',status:coding.status,summary:coding.summary||null,changedFiles:coding.changedFiles||[]},
  {kind:'verification-command',command:task.verify,exitCode:verification.code,stdout:verification.stdout.slice(-4000),stderr:verification.stderr.slice(-4000)}
];

if(verification.code!==0){
  await markTask(stateFile,task.id,'FAILED',evidence);
  console.error(JSON.stringify({status:'FAILED',task:task.id,evidence},null,2));
  process.exit(1);
}

const finalStatus=coding.status==='VERIFIED_NOOP'?'NOOP':'VERIFIED';
await markTask(stateFile,task.id,finalStatus,evidence);
console.log(JSON.stringify({status:finalStatus,task,verification:'passed',evidence},null,2));
