import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dispatchToElite } from '../ai-operating-operator/elite-bridge.mjs';

const execFileAsync=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'bot-elite-repair-'));
const artifactContent='Verified bounded inference capability for Elite planning and repair.';
const sha256=crypto.createHash('sha256').update(artifactContent,'utf8').digest('hex');
const revision='a'.repeat(40);
delete process.env.ELITE_EXECUTOR_URL;
process.env.ELITE_LOCAL_ENGINE='1';
process.env.ELITE_ALLOWED_ROOT=root;

const calls=[];
let plannerCalls=0;
let repairCalls=0;

const fakeOllama={
  async runOllama(input){
    const messages=input.arguments?.messages||[];
    const prompt=String(messages.at(-1)?.content||'');
    calls.push(prompt);
    if(prompt.includes('You are Elite\'s repair agent')){
      repairCalls++;
      return {executionId:'bot-repair-'+repairCalls,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify({summary:'repair syntax defect',changes:[{path:'repair-target.mjs',content:'export default 42;'}]})}}}};
    }
    if(prompt.includes('independent')&&prompt.includes('reviewer')){
      return {executionId:'bot-review-'+calls.length,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify({approved:true,findings:[],reason:'verified'})}}}};
    }
    if(prompt.includes('task decomposition specialist')){
      return {executionId:'bot-decompose-'+calls.length,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify({subtasks:[]})}}}};
    }
    if(prompt.includes("You are Elite's planning agent")){
      plannerCalls++;
      const content={summary:'intentional first-attempt syntax defect',changes:[{path:'repair-target.mjs',content:'export default ;'}]};
      return {executionId:'bot-plan-'+plannerCalls,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify(content)}}}};
    }
    return {executionId:'bot-inference-'+calls.length,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify({summary:'no-op',changes:[]})}}}};
  },
  verifyOllamaResult:({result})=>({verifierId:'ollama-independent-verifier-v1',passed:Boolean(result?.result?.ok===true),errors:[]})
};

try{
  await execFileAsync('git',['init','-q'],{cwd:root});
  await writeFile(join(root,'README.md'),'bot-elite repair test\n','utf8');
  await execFileAsync('git',['add','README.md'],{cwd:root});
  await execFileAsync('git',['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','init'],{cwd:root});

  const invocation={mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'};
  const result=await dispatchToElite({
    workspaceRoot:root,
    goal:'Repair the intentionally broken repository target and verify the repair.',
    requestedCapabilities:['ai.local.ollama'],
    allowedActions:['capability_invoke'],
    capabilitySelection:{id:'verified-local-inference',repo:'example/capability',revision,evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',capabilityType:'skill',capability:'bounded inference',invocation},
    capabilityArtifact:{repo:'example/capability',revision,file:'README.md',sha256,content:artifactContent},
    capabilityArtifactInvocation:{...invocation,artifact:{repo:'example/capability',revision,file:'README.md',sha256}},
    project:'bot-elite-autonomous-repair',
    localIsolate:false
  },{
    capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},
    adapterOverrides:{'ai.local.ollama':{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1',...fakeOllama}},
    verifierOverrides:{'ai.local.ollama':fakeOllama}
  });

  assert.equal(result.verification?.passed,true,JSON.stringify(result));
  assert.equal(result.result?.status,'TASK_VERIFIED',JSON.stringify(result.result));
  assert.ok(repairCalls>=1,JSON.stringify({repairCalls,plannerCalls,calls,result},null,2));
  assert.ok(calls.some(x=>x.includes('You are Elite\'s repair agent')),'Repair prompt did not reach Bot');
  assert.ok(result.result?.evidence?.some(x=>x.kind==='capability_inference'&&x.role==='repair'),'Bot repair evidence missing');
  console.log(JSON.stringify({ok:true,status:result.result.status,botPlannerCalls:plannerCalls,botRepairCalls:repairCalls,botInferenceEvidence:true},null,2));
}finally{
  await rm(root,{recursive:true,force:true});
}
