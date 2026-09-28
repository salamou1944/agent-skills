import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {dispatchToElite} from '../ai-operating-operator/elite-bridge.mjs';

const execFileAsync=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'elite-invocation-feedback-'));
const contentText='Verified capability guidance: inspect, reproduce, repair, verify.';
const sha256=crypto.createHash('sha256').update(contentText,'utf8').digest('hex');
const revision='289dc1c4ce47cde394dc27e47b8da47fbe0d12e1';
process.env.ELITE_LOCAL_ENGINE='1';
process.env.ELITE_ALLOWED_ROOT=root;
const invocation={mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'};
let providerContext='';
let invocationCount=0;
const fakeAdapter={
  async runOllama(input){invocationCount++;return {executionId:'elite-feedback-invocation-1',target:'local-ollama',result:{status:200,ok:true,data:{message:{content:'verified invocation output'}}}};},
  verifyOllamaResult:({result})=>({verifierId:'ollama-independent-verifier-v1',passed:Boolean(result?.result?.ok===true),errors:[]})
};
try {
  await execFileAsync('git',['init','-q'],{cwd:root});
  await writeFile(join(root,'README.md'),'test workspace\n','utf8');
  await execFileAsync('git',['add','README.md'],{cwd:root});
  await execFileAsync('git',['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','init'],{cwd:root});
  const result=await dispatchToElite({
    workspaceRoot:root,
    goal:'Use the verified capability invocation result in Elite planning.',
    capabilitySelection:{id:'mufeedvh-superpowers-systematic-debugging',repo:'mufeedvh/superpowers',revision,evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',capabilityType:'skill',capability:'systematic debugging',artifact:{sha256},invocation},
    capabilityArtifact:{repo:'mufeedvh/superpowers',revision,file:'skills/systematic-debugging/SKILL.md',sha256,content:contentText},
    capabilityArtifactInvocation:{...invocation,artifact:{repo:'mufeedvh/superpowers',revision,file:'skills/systematic-debugging/SKILL.md',sha256}},
    project:'elite-invocation-feedback',
    provider:async ({role,context,capabilityInvocation})=>{
      if(role==='planner'){providerContext=context;assert.equal(capabilityInvocation.result.verification.verifierId,'ollama-independent-verifier-v1');}
      return {summary:'no-op verified plan',changes:[]};
    }
  },{
    capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},
    adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeAdapter}},
    verifierOverrides:{'ai.local.ollama':fakeAdapter}
  });
  assert.equal(invocationCount,1);
  assert.match(providerContext,/verified invocation output/);
  assert.equal(result.result.status,'TASK_VERIFIED');
  assert.equal(result.result.evidence.some(x=>x.kind==='capability_invocation'&&x.passed===true),true);
  console.log(JSON.stringify({ok:true,eliteInvocation:'PASS',plannerFeedback:'PASS',independentVerification:'PASS',status:result.result.status}));
} finally {
  await rm(root,{recursive:true,force:true});
}
