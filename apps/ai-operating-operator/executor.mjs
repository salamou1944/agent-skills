import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTask,evidence,verifyCompletion} from './operator-core.mjs';
import {buildExecutionPlan} from './skill-router.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));

async function loadJson(name){return JSON.parse(await fs.readFile(path.join(ROOT,name),'utf8'));}
async function loadAdapter(id){
  const registry=await loadJson('adapter-registry.json');
  const entry=registry.adapters[id];
  if(!entry||entry.status!=='ADAPTER_READY')throw new Error('adapter_not_ready');
  return {entry,module:await import(new URL(entry.module,import.meta.url))};
}
async function loadVerifier(id){
  if(id==='nmap-independent-verifier-v1')return import('./verifiers/nmap-verifier.mjs');
  throw new Error('verifier_not_registered');
}

export async function executeTask(input,{capabilities={},adapterInputs={},runnerOverrides={}}={}){
  const task=createTask(input);
  const registry=await loadJson('adapter-registry.json');
  const plan=await buildExecutionPlan(task,{capabilities,adapters:registry.adapters});
  if(!plan.executionAllowed)return {taskId:task.taskId,state:'BLOCKED_PERMISSION',plan,evidence:[evidence('action',{accepted:false,reason:'execution_gate'})]};
  if(plan.executableAdapters.length!==1)return {taskId:task.taskId,state:'REVIEW_REQUIRED',plan,evidence:[evidence('action',{accepted:false,reason:'single_adapter_boundary'})]};
  const capability=plan.executableAdapters[0];
  const {entry,module}=await loadAdapter(capability);
  const inputData={...(adapterInputs[capability]||{})};
  if(capability==='security.network.nmap'&&runnerOverrides.nmap)inputData.runner=runnerOverrides.nmap;
  const result=capability==='security.network.nmap'
    ? await module.runNmap(inputData)
    : (()=>{throw new Error('adapter_execution_not_implemented')})();
  const actionEvidence=evidence('action',{adapter:capability,executionId:result.executionId,target:result.target,status:result.result?.status,code:result.result?.code});
  const verifier=await loadVerifier(entry.independentVerifier);
  const verification=verifier.verifyNmapResult({result,target:inputData.target});
  const verificationEvidence=evidence('independent_verification',{verifierId:verification.verifierId,passed:verification.passed,errors:verification.errors});
  const report={taskId:task.taskId,state:'EVIDENCE_CAPTURED',evidence:[actionEvidence,verificationEvidence],verification};
  return {...report,completion:verifyCompletion(task,report)};
}
