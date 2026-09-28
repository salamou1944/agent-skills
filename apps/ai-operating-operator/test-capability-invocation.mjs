import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {executeTask} from './executor.mjs';

const content='Verified systematic-debugging skill: trace the root cause, reproduce it, patch the smallest safe change, then verify independently.';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
let invoked=false;
let received=null;
const fakeAdapter={
  async runOllama(input){
    invoked=true;
    received=input;
    return {executionId:'fake-capability-invocation-1',target:'local-ollama',result:{status:200,ok:true,data:{message:{content:'applied'}}}};
  },
  verifyOllamaResult:()=>({verifierId:'fake-independent-verifier-v1',passed:true,errors:[]})
};
const task={
  taskId:'capability-invocation-test',
  goal:'Apply the verified systematic debugging skill to this task.',
  project:'test',
  allowedActions:['capability_invoke'],
  requestedCapabilities:['ai.local.ollama'],
  capabilitySelection:{
    id:'mufeedvh-superpowers-systematic-debugging',
    repo:'mufeedvh/superpowers',
    revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',
    evidenceLevel:'VERIFIED_FROM_SOURCE',
    license:'MIT',
    capabilityType:'skill',
    capability:'systematic debugging',
    invocation:{mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'}
  },
  capabilityArtifact:{repo:'mufeedvh/superpowers',revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',file:'skills/systematic-debugging/SKILL.md',sha256,content},
  capabilityArtifactInvocation:{mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'}
};
const result=await executeTask(task,{
  capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},
  adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeAdapter}},
  verifierOverrides:{'ai.local.ollama':fakeAdapter}
});
assert.equal(invoked,true);
assert.equal(result.state,'EVIDENCE_CAPTURED');
assert.equal(result.completion.ok,true);
assert.equal(received.action,'chat');
assert.equal(received.arguments.messages[1].content,content);
assert.equal(result.evidence.find(x=>x.kind==='action').capabilityInvocation.artifactSha256,sha256);

const tampered={...task,capabilityArtifact:{...task.capabilityArtifact,content:content+' tampered'}};
const blocked=await executeTask(tampered,{capabilities:{'ai.local.ollama':{authorized:true,reachable:true}}});
assert.equal(blocked.state,'BLOCKED_EXTERNAL_DEPENDENCY');
assert.equal(blocked.evidence[0].reason,'capability_invocation_checksum_mismatch');

const unauthorized={...task,allowedActions:[]};
const denied=await executeTask(unauthorized,{capabilities:{'ai.local.ollama':{authorized:true,reachable:true}}});
assert.equal(denied.state,'BLOCKED_PERMISSION');
assert.equal(denied.evidence[0].reason,'capability_invocation_not_authorized');

console.log(JSON.stringify({ok:true,capabilityInvocation:'PASS',checksumGate:'PASS',authorizationGate:'PASS',independentVerification:'PASS'}));
