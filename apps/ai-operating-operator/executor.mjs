import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTask,evidence,verifyCompletion} from './operator-core.mjs';
import {buildExecutionPlan} from './skill-router.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
async function loadJson(name){return JSON.parse(await fs.readFile(path.join(ROOT,name),'utf8'));}
async function loadAdapter(id){const registry=await loadJson('adapter-registry.json');const entry=registry.adapters[id];if(!entry||entry.status!=='ADAPTER_READY')throw new Error('adapter_not_ready');return {entry,module:await import(new URL(entry.module,import.meta.url))};}
async function loadVerifier(id){
  if(id==='nmap-independent-verifier-v1')return import('./verifiers/nmap-verifier.mjs');
  if(id==='github-independent-verifier-v1')return import('./verifiers/github-verifier.mjs');
  if(id==='http-independent-verifier-v1')return import('./verifiers/http-verifier.mjs');
  if(id==='cua-independent-verifier-v1')return import('./verifiers/cua-verifier.mjs');
  if(id==='browser-independent-verifier-v1')return import('./adapters/browser-adapter.mjs');
  if(id==='research-independent-verifier-v1')return import('./adapters/research-adapter.mjs');
  if(id==='ollama-independent-verifier-v1')return import('./adapters/ollama-adapter.mjs');
  if(id==='workspace-independent-verifier-v1')return import('./adapters/workspace-adapter.mjs');
  if(id==='api-catalog-independent-verifier-v1')return import('./adapters/api-catalog-adapter.mjs');
  if(id==='openapi-mcp-independent-verifier-v1')return import('./adapters/openapi-mcp-adapter.mjs');
  if(id==='mcp-independent-verifier-v1')return import('./adapters/mcp-adapter.mjs');
  throw new Error('verifier_not_registered');
}

export async function executeTask(input,{capabilities={},adapterInputs={},runnerOverrides={},adapterEnv=process.env}={}){
  const task=createTask(input);
  const registry=await loadJson('adapter-registry.json');
  const plan=await buildExecutionPlan(task,{capabilities,adapters:registry.adapters});
  if(!plan.executionAllowed){const blocked=plan.capabilities.find(x=>x.status!=='AVAILABLE');return {taskId:task.taskId,state:blocked?.status||'BLOCKED_PERMISSION',plan,evidence:[evidence('action',{accepted:false,reason:'execution_gate'})]};}
  if(plan.executableAdapters.length!==1)return {taskId:task.taskId,state:'REVIEW_REQUIRED',plan,evidence:[evidence('action',{accepted:false,reason:'single_adapter_boundary'})]};
  const capability=plan.executableAdapters[0];
  const {entry,module}=await loadAdapter(capability);
  const inputData={...(adapterInputs[capability]||{}),task};
  if(capability==='security.network.nmap'&&runnerOverrides.nmap)inputData.runner=runnerOverrides.nmap;
  let result;
  if(capability==='security.network.nmap')result=await module.runNmap(inputData);
  else if(capability==='platform.github')result=await module.runGitHub(inputData,adapterEnv);
  else if(capability==='platform.http')result=await module.runHttp(inputData);
  else if(capability==='browser.automation')result=await module.runBrowser(inputData,adapterEnv);
  else if(capability==='research.search'||capability==='research.read')result=await module.runResearch({...inputData,action:capability.split('.')[1]});
  else if(capability==='ai.local.ollama')result=await module.runOllama(inputData);
  else if(capability==='workspace.recovery')result=await module.runWorkspace(inputData,adapterEnv);
  else if(capability==='research.api_catalog')result=await module.runApiCatalog(inputData);
  else if(capability==='mcp.openapi_bridge')result=await module.runOpenApiMcp(inputData);
  else if(capability==='mcp.gateway')result=await module.runMcp(inputData,adapterEnv);
  else if(capability==='platform.cua.driver')result=await module.runCua(inputData,adapterEnv);
  else throw new Error('adapter_execution_not_implemented');
  const actionEvidence=evidence('action',{adapter:capability,executionId:result.executionId,target:result.target,status:result.result?.status,code:result.result?.code});
  const verifier=await loadVerifier(entry.independentVerifier);
  let verification;
  if(capability==='security.network.nmap')verification=verifier.verifyNmapResult({result,target:inputData.target});
  else if(capability==='platform.http')verification=verifier.verifyHttpResult({result,expectedStatus:inputData.expectedStatus});
  else if(capability==='browser.automation')verification=verifier.verifyBrowserResult({result,action:inputData.action||'health'});
  else if(capability==='research.search'||capability==='research.read')verification=verifier.verifyResearchResult({result,action:capability.split('.')[1]});
  else if(capability==='ai.local.ollama')verification=verifier.verifyOllamaResult({result});
  else if(capability==='workspace.recovery')verification=verifier.verifyWorkspaceResult({result,action:inputData.action||'health'});
  else if(capability==='research.api_catalog')verification=verifier.verifyApiCatalogResult({result,action:inputData.action||'health'});
  else if(capability==='mcp.openapi_bridge')verification=verifier.verifyOpenApiMcpResult({result});
  else if(capability==='mcp.gateway')verification=verifier.verifyMcpResult({result,action:inputData.action||'health'});
  else if(capability==='platform.cua.driver')verification=verifier.verifyCuaResult({result});
  else verification=verifier.verifyGitHubResult({result});
  const verificationEvidence=evidence('verification',{verifierId:verification.verifierId,passed:verification.passed,errors:verification.errors});
  const independentEvidence=evidence('independent_verification',{verifierId:verification.verifierId,passed:verification.passed,errors:verification.errors});
  const report={taskId:task.taskId,state:'EVIDENCE_CAPTURED',evidence:[actionEvidence,verificationEvidence,independentEvidence],verification};
  return {...report,completion:verifyCompletion(task,report)};
}
