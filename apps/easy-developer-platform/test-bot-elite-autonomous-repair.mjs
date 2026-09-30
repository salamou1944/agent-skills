import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dispatchToElite } from '../ai-operating-operator/elite-bridge.mjs';
import { runEliteTask } from './elite-harness.mjs';

const execFileAsync=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'bot-elite-repair-'));
const artifactContent='Verified bounded inference capability for Elite planning and repair.';
const sha256=crypto.createHash('sha256').update(artifactContent,'utf8').digest('hex');
const revision='a'.repeat(40);
delete process.env.ELITE_EXECUTOR_URL;
process.env.ELITE_LOCAL_ENGINE='1';
process.env.ELITE_ALLOWED_ROOT=root;

let botCalls=0;
const fakeOllama={
  async runOllama(input){
    botCalls++;
    const prompt=String(input.arguments?.messages?.at(-1)?.content||'');
    if(botCalls===1){
      assert.match(prompt,/Use the verified Bot capability as Elite inference/,'Elite inference goal was dropped before reaching Ollama');
      assert.match(prompt,/Verified bounded inference capability for Elite planning and repair/,'verified capability artifact was not supplied to Ollama');
    }
    const response=prompt.includes("You are Elite's planner")
      ? {summary:'bot-backed no-op plan',changes:[]}
      : prompt.includes('approved')
        ? {approved:true,findings:[],reason:'verified'}
        : {subtasks:[]};
    return {executionId:'bot-fixture-'+botCalls,target:'fake-ollama',result:{status:200,ok:true,data:{message:{content:JSON.stringify(response)}}}};
  },
  verifyOllamaResult:({result})=>({verifierId:'ollama-independent-verifier-v1',passed:Boolean(result?.result?.ok===true),errors:[]})
};

try{
  await execFileAsync('git',['init','-q'],{cwd:root});
  await writeFile(join(root,'README.md'),'bot-elite repair test\n','utf8');
  await execFileAsync('git',['add','README.md'],{cwd:root});
  await execFileAsync('git',['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','init'],{cwd:root});

  const invocation={mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'};
  const dispatch=await dispatchToElite({
    workspaceRoot:root,
    goal:'Use the verified Bot capability as Elite inference.',
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
  assert.equal(dispatch.verification?.passed,true,JSON.stringify(dispatch));
  assert.equal(dispatch.result?.status,'TASK_VERIFIED',JSON.stringify(dispatch.result));
  assert.ok(botCalls>=2,'Bot capability was not used for Elite inference');

  let repairCalls=0;
  const repairRoot=await mkdtemp(join(tmpdir(),'elite-harness-repair-'));
  try{
    const result=await runEliteTask('repair an intentionally broken file',{
      root:repairRoot,
      policy:{maxSteps:16,maxRepairs:2,requireReview:false,requireVerification:true},
      inspect:async()=>({context:'broken repository fixture'}),
      provider:async({role})=>{
        if(role==='planner')return {summary:'intentional broken first plan',changes:[{path:'broken.mjs',content:'export default ;'}]};
        if(role==='repair'){repairCalls++;return {summary:'verified repair',changes:[{path:'broken.mjs',content:'export default 42;'}]};}
        return {summary:'unused',changes:[]};
      },
      execute:async({changes})=>{for(const c of changes){await writeFile(join(repairRoot,c.path),c.content,'utf8');}return {ok:true};},
      test:async()=>({ok:true}),
      verify:async({changes})=>{
        const check=await execFileAsync(process.execPath,['--check',join(repairRoot,changes[0].path)]).then(()=>({ok:true})).catch(()=>({ok:false}));
        return {ok:check.ok,evidence:{kind:'repair-verification',passed:check.ok}};
      }
    });
    assert.equal(result.status,'TASK_VERIFIED',JSON.stringify(result));
    assert.equal(repairCalls,1);
  }finally{await rm(repairRoot,{recursive:true,force:true});}

  console.log(JSON.stringify({ok:true,botInference:'PASS',eliteRepairIteration:'PASS',status:'TASK_VERIFIED'},null,2));
}finally{await rm(root,{recursive:true,force:true});}
