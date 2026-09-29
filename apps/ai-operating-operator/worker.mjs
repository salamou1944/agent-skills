import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {executeTask} from './executor.mjs';
import {probeAccounts} from './account-probes.mjs';
import {createRun,updateRun,recoverInterruptedRuns} from './run-ledger.mjs';
import {retryDecision} from './retry-policy.mjs';
import {dispatchToElite} from './elite-bridge.mjs';
import {selectVerifiedCapability} from './capability-selection.mjs';
import crypto from 'node:crypto';
import {buildCapabilityInvocation} from './capability-invocation.mjs';

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

export async function prepareTaskForExecution(task,{selectCapability=selectVerifiedCapability}={}){
  if(task.executionTarget!=='elite'||!task.capabilityQuery)return {ok:true,task};
  const selection=await selectCapability({query:task.capabilityQuery,compatibility:task.capabilityCompatibility||null,allowedLicenses:task.allowedLicenses||null,limit:Number(task.capabilityLimit||20)});
  if(selection.decision==='DISCOVERY_ONLY')return {ok:false,state:'DISCOVERY_ONLY',task,selection};
  if(selection.decision!=='ADAPT_AND_VERIFY')return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',task,selection};
  return {ok:true,task:{...task,capabilitySelection:selection.selected,sourceRevision:selection.selected.revision,capabilityArtifactFile:selection.selected.artifact?.file||task.capabilityArtifactFile||null,capabilityArtifactSha256:selection.selected.artifact?.sha256||task.capabilityArtifactSha256||null,capabilityArtifactInvocation:selection.selected.invocation||task.capabilityArtifactInvocation||null,requestedCapabilities:Array.from(new Set([...(task.requestedCapabilities||[]),selection.selected.capabilityType,selection.selected.invocation?.adapter].filter(Boolean))),constraints:Array.from(new Set([...(task.constraints||[]),'capability-selected-verified']))},selection};
}

export async function hydrateCapabilityArtifact(selection,{fetchImpl=fetch,file='README.md',expectedSha256=null}={}) {
  if(!selection?.repo||!selection?.revision)return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'capability_artifact_identity_incomplete'};
  if(!/^https:\/\/raw\.githubusercontent\.com\//.test('https://raw.githubusercontent.com/'))return {ok:false,state:'BLOCKED_PERMISSION',reason:'raw_github_not_allowed'};
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(selection.repo))return {ok:false,state:'BLOCKED_PERMISSION',reason:'repository_not_allowlisted'};
  if(!/^[0-9a-f]{40}$/.test(selection.revision))return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'revision_not_pinned'};
  const safeFile=String(file||'README.md').replace(/^\/+/, '');
  if(safeFile.includes('..'))return {ok:false,state:'BLOCKED_PERMISSION',reason:'artifact_path_traversal'};
  const url=`https://raw.githubusercontent.com/${selection.repo}/${selection.revision}/${safeFile}`;
  try{
    const response=await fetchImpl(url,{headers:{accept:'text/plain','user-agent':'ai-operating-operator-capability-artifact'}});
    if(!response.ok)return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:`artifact_http_${response.status}`,url};
    const content=await response.text();
    const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
    if(expectedSha256 && sha256!==String(expectedSha256).toLowerCase())return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'artifact_checksum_mismatch',url,sha256,expectedSha256};
    return {ok:true,artifact:{repo:selection.repo,revision:selection.revision,file:safeFile,url,sha256,bytes:Buffer.byteLength(content,'utf8'),content}};
  }catch(error){return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:String(error?.message||error),url};}
}

export function classifyFailure(result){
  const failure=result?.failure||{};
  if(result?.state==='BLOCKED_PERMISSION'||failure.class==='permission')return 'BLOCKED_PERMISSION';
  if(result?.state==='BLOCKED_EXTERNAL_DEPENDENCY'||failure.class==='external_dependency')return 'BLOCKED_EXTERNAL_DEPENDENCY';
  if(failure.class)return String(failure.class);
  if(result?.state==='FAILED')return 'unknown';
  return null;
}

export async function processNextTask({queueDir=queue,resultDir=results,caps={},adapters={'platform.github':{status:'ADAPTER_READY'}},selectCapability=selectVerifiedCapability,hydrateArtifact=hydrateCapabilityArtifact,executeTaskImpl=async (task,options)=>task.executionTarget==='elite'?dispatchToElite(task,options):executeTask(task,options),sleepImpl=(ms)=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  const selected=await selectNextTask(queueDir);
  if(!selected)return {selected:null,state:'IDLE'};
  const {name,task}=selected;
  const p=path.join(queueDir,name);
  let run;
  try{
    run=await createRun(task);
    await updateRun(run.runId,{state:'RUNNING',attempt:(run.attempt||0)+1});
    const prepared=await prepareTaskForExecution(task,{selectCapability});
    if(!prepared.ok){
      const result={taskId:task.taskId,state:prepared.state,evidence:[{kind:'capability_selection',selection:prepared.selection}],completion:{ok:false,errors:['capability_selection_gate']},failure:{class:'external_dependency',message:'no verified capability candidate passed selection gate'}};
      await fs.writeFile(path.join(resultDir,name),JSON.stringify({...result,runId:run.runId},null,2));
      await updateRun(run.runId,{state:result.state,attempt:(run.attempt||0)+1,resultState:result.state,completion:result.completion,evidence:result.evidence,failure:result.failure,failureClass:'BLOCKED_EXTERNAL_DEPENDENCY',retry:{retry:false}});
      return {selected:name,taskId:task.taskId,runId:run.runId,state:result.state,retry:{retry:false}};
    }
    const artifact=prepared.task.capabilitySelection ? await hydrateArtifact(prepared.task.capabilitySelection,{file:prepared.task.capabilityArtifactFile||'README.md',expectedSha256:prepared.task.capabilityArtifactSha256||null}) : {ok:true,artifact:null};
    if(!artifact.ok){
      const result={taskId:task.taskId,state:artifact.state,evidence:[{kind:'capability_artifact',artifact}],completion:{ok:false,errors:['capability_artifact_hydration']},failure:{class:artifact.state==='BLOCKED_PERMISSION'?'permission':'external_dependency',message:artifact.reason}};
      await fs.writeFile(path.join(resultDir,name),JSON.stringify({...result,runId:run.runId},null,2));
      await updateRun(run.runId,{state:result.state,attempt:(run.attempt||0)+1,resultState:result.state,completion:result.completion,evidence:result.evidence,failure:result.failure,failureClass:result.state,retry:{retry:false}});
      return {selected:name,taskId:task.taskId,runId:run.runId,state:result.state,retry:{retry:false}};
    }
    let executionTask={...prepared.task,capabilityArtifact:artifact.artifact};
    if(prepared.task.capabilitySelection?.invocation){
      const invocation=buildCapabilityInvocation(prepared.task.capabilitySelection,artifact.artifact);
      if(!invocation.ok){
        const result={taskId:task.taskId,state:invocation.state,evidence:[{kind:'capability_invocation',invocation}],completion:{ok:false,errors:['capability_invocation_gate']},failure:{class:invocation.state==='BLOCKED_PERMISSION'?'permission':'external_dependency',message:invocation.reason}};
        await fs.writeFile(path.join(resultDir,name),JSON.stringify({...result,runId:run.runId},null,2));
        await updateRun(run.runId,{state:result.state,attempt:(run.attempt||0)+1,resultState:result.state,completion:result.completion,evidence:result.evidence,failure:result.failure,failureClass:result.state,retry:{retry:false}});
        return {selected:name,taskId:task.taskId,runId:run.runId,state:result.state,retry:{retry:false}};
      }
      executionTask={...executionTask,capabilityInvocation:invocation.invocation,requestedCapabilities:Array.from(new Set([...(executionTask.requestedCapabilities||[]),prepared.task.capabilitySelection.invocation.adapter]))};
    }
    const result=await executeTaskImpl(executionTask,{capabilities:{...caps,github:caps.github,'platform.github':caps.github,[executionTask.capabilityArtifactInvocation?.adapter||prepared.task.capabilitySelection?.invocation?.adapter||'']:executionTask.capabilityArtifactInvocation?{authorized:true,reachable:true}:undefined},adapters,adapterInputs:task.adapterInputs||{},adapterEnv:{...process.env}});
    const terminal=result.completion?.ok===true||result.state==='VERIFIED'?'VERIFIED':(result.state||'FAILED');
    const attempt=(run.attempt||0)+1;
    const failureClass=classifyFailure(result);
    const retry=terminal==='FAILED' ? retryDecision({attempt:Math.max(0,attempt-1),maxRetries:Number(task.maxRetries??2),errorClass:failureClass||'unknown'}) : {retry:false};
    const persistedState=retry.retry?'RETRYING':terminal;
    const persistedResult={...result,runId:run.runId,failureClass,retry};
    await fs.writeFile(path.join(resultDir,name),JSON.stringify(persistedResult,null,2));
    await updateRun(run.runId,{state:persistedState,attempt,resultState:result.state,completion:result.completion||null,evidence:result.evidence||[],failure:result.failure||null,failureClass,retry});
    if(persistedState!=='RETRYING')await fs.unlink(p);
    if(retry.retry)await sleepImpl(retry.backoffMs);
    return {selected:name,taskId:task.taskId,runId:run.runId,state:persistedState,retry};
  }catch(error){
    const failure={class:'worker_error',message:error.message};
    await fs.writeFile(path.join(resultDir,name),JSON.stringify({taskId:task.taskId,state:'FAILED',runId:run?.runId,failure},null,2));
    if(run?.runId)await updateRun(run.runId,{state:'FAILED',failure});
    return {selected:name,taskId:task.taskId,runId:run?.runId||null,state:'FAILED',failure};
  }
}

async function main(){
  await fs.mkdir(queue,{recursive:true});await fs.mkdir(results,{recursive:true});
  await recoverInterruptedRuns();
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
    if(cycle.state==='IDLE'||cycle.state==='FAILED')break;
  }
}
if(import.meta.url===`file://${process.argv[1]}`)main().catch(error=>{console.error(error);process.exitCode=1;});
