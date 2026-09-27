import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {executeTask} from './executor.mjs';
import {probeAccounts} from './account-probes.mjs';
import {createRun,updateRun} from './run-ledger.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const queue=process.env.OPERATOR_TASK_QUEUE||path.join(ROOT,'runtime','tasks');
const results=process.env.OPERATOR_RESULT_DIR||path.join(ROOT,'runtime','results');

export async function selectNextTask(queueDir=queue){
  const files=(await fs.readdir(queueDir)).filter(x=>x.endsWith('.json'));
  const candidates=[];
  for(const name of files){try{const task=JSON.parse(await fs.readFile(path.join(queueDir,name),'utf8'));candidates.push({name,task});}catch{}}
  candidates.sort((a,b)=>Number(a.task.priority??100)-Number(b.task.priority??100)||String(a.task.createdAt??'').localeCompare(String(b.task.createdAt??''))||a.name.localeCompare(b.name));
  return candidates[0]||null;
}

export async function processNextTask({queueDir=queue,resultDir=results,caps={},adapters={'platform.github':{status:'ADAPTER_READY'}},executeTaskImpl=executeTask}={}){
  const selected=await selectNextTask(queueDir);
  if(!selected)return {selected:null,state:'IDLE'};
  const {name,task}=selected;
  const p=path.join(queueDir,name);
  let run;
  try{
    run=await createRun(task);
    await updateRun(run.runId,{state:'RUNNING',attempt:(run.attempt||0)+1});
    const result=await executeTaskImpl(task,{capabilities:{...caps,github:caps.github,'platform.github':caps.github},adapters,adapterInputs:task.adapterInputs||{},adapterEnv:{...process.env,OPERATOR_GITHUB_REPOS:process.env.GITHUB_REPOSITORY}});
    const terminal=result.completion?.ok===true||result.state==='VERIFIED'?'VERIFIED':(result.state||'FAILED');
    await fs.writeFile(path.join(resultDir,name),JSON.stringify({...result,runId:run.runId},null,2));
    await updateRun(run.runId,{state:terminal,attempt:(run.attempt||0)+1,resultState:result.state,completion:result.completion||null,evidence:result.evidence||[]});
    if(terminal==='VERIFIED')await fs.unlink(p);
    return {selected:name,taskId:task.taskId,runId:run.runId,state:terminal};
  }catch(error){
    const failure={class:'worker_error',message:error.message};
    await fs.writeFile(path.join(resultDir,name),JSON.stringify({taskId:task.taskId,state:'FAILED',runId:run?.runId,failure},null,2));
    if(run?.runId)await updateRun(run.runId,{state:'FAILED',failure});
    return {selected:name,taskId:task.taskId,runId:run?.runId||null,state:'FAILED',failure};
  }
}

async function main(){
  await fs.mkdir(queue,{recursive:true});await fs.mkdir(results,{recursive:true});
  const caps=await probeAccounts();
  if(process.env.GITHUB_ACTIONS==='true'&&process.env.GITHUB_REPOSITORY){
    const allowed=String(process.env.OPERATOR_GITHUB_REPOS||process.env.GITHUB_REPOSITORY||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(allowed.includes(process.env.GITHUB_REPOSITORY)){
      caps.github={configured:true,authorized:true,reachable:true,canRead:true,canWrite:false,canDeploy:false,source:'github-actions-workflow-scope'};
    }
  }
  const adapters={'platform.github':{status:'ADAPTER_READY'}};
  while(true){
    const cycle=await processNextTask({queueDir:queue,resultDir:results,caps,adapters});
    if(cycle.state==='IDLE')break;
  }
}
if(import.meta.url===`file://${process.argv[1]}`)main().catch(error=>{console.error(error);process.exitCode=1;});
