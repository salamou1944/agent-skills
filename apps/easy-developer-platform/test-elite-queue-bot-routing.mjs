import assert from 'node:assert/strict';
import test from 'node:test';
import { executeQueueTask } from './elite-queue-executor.mjs';

test('project queue routes eligible Elite tasks through verified Bot capability before provider fallback', async()=>{
  const calls=[];
  const task={taskId:'queue-bot-proof',goal:'repair queue task',executionTarget:'elite',capabilityQuery:'verified coding skill'};
  const result=await executeQueueTask(task,{
    syncFeed:async()=>({ok:true}),
    prepare:async()=>({ok:true,task:{...task,capabilitySelection:{id:'cap-1',revision:'a'.repeat(40),artifact:{sha256:'abc'},invocation:{adapter:'ai.local.ollama'}},capabilityArtifactFile:'SKILL.md'}}),
    hydrate:async()=>({ok:true,artifact:{repo:'example/repo',revision:'a'.repeat(40),file:'SKILL.md',sha256:'abc',content:'verified',bytes:8}}),
    botExecutor:async(input,options)=>{calls.push({input,options});return {state:'EVIDENCE_CAPTURED',completion:{ok:true},verification:{passed:true},evidence:[{kind:'proof'}],result:{status:'TASK_VERIFIED'}}},
    providerExecutor:async()=>{throw new Error('provider fallback must not run')}
  });
  assert.equal(result.executionPath,'bot-backed-elite');
  assert.equal(result.verification.passed,true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].input.capabilityArtifact.content,'verified');
});

test('project queue preserves provider fallback when no verified Ollama capability is available', async()=>{
  const task={taskId:'queue-fallback-proof',goal:'repair queue task',executionTarget:'elite',capabilityQuery:'verified coding skill'};
  const result=await executeQueueTask(task,{
    syncFeed:async()=>({ok:true}),
    prepare:async()=>({ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',selection:{decision:'BLOCKED_EXTERNAL_DEPENDENCY'}}),
    providerExecutor:async()=>({status:'BLOCKED',summary:'provider unavailable'})
  });
  assert.equal(result.executionPath,'provider-fallback');
  assert.equal(result.status,'BLOCKED');
});
