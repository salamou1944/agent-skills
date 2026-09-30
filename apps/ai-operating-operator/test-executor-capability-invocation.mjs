import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {executeTask} from './executor.mjs';

const content='Verified systematic-debugging skill: trace the root cause, reproduce it, patch the smallest safe change, then verify independently.';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const revision='289dc1c4ce47cde394dc27e47b8da47fbe0d12e1';
const invocation={mode:'prompt',adapter:'ai.local.ollama',action:'chat',contractVersion:'capability-invocation-v1'};
let invoked=false;
let received=null;
const fakeAdapter={
  async runOllama(input){invoked=true;received=input;return {executionId:'fake-capability-invocation-1',target:'local-ollama',result:{status:200,ok:true,data:{message:{content:'applied'}}}};},
  verifyOllamaResult:({result})=>({verifierId:'ollama-independent-verifier-v1',passed:Boolean(result?.result?.ok===true),errors:[]})
};
const task={
  taskId:'capability-invocation-test',goal:'Apply the verified systematic debugging skill to this task.',project:'test',allowedActions:['capability_invoke'],requestedCapabilities:['ai.local.ollama'],
  capabilitySelection:{id:'mufeedvh-superpowers-systematic-debugging',repo:'mufeedvh/superpowers',revision,evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',capabilityType:'skill',capability:'systematic debugging',artifact:{sha256},invocation},
  capabilityArtifact:{repo:'mufeedvh/superpowers',revision,file:'skills/systematic-debugging/SKILL.md',sha256,content},
  capabilityArtifactInvocation:{...invocation,artifact:{repo:'mufeedvh/superpowers',revision,file:'skills/systematic-debugging/SKILL.md',sha256}}
};
const options={capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1',...fakeAdapter}},verifierOverrides:{'ai.local.ollama':fakeAdapter}};
const result=await executeTask(task,options);
assert.equal(invoked,true);assert.equal(received.task.capabilityArtifact.content,content);assert.match(received.arguments.messages.at(-1).content,/Apply the verified systematic debugging skill to this task\./);assert.match(received.arguments.messages.at(-1).content,/Verified systematic-debugging skill:/);assert.equal(result.state,'EVIDENCE_CAPTURED');assert.equal(result.completion.ok,true);assert.equal(result.verification.verifierId,'ollama-independent-verifier-v1');
const tampered={...task,capabilityArtifact:{...task.capabilityArtifact,content:content+' tampered'}};
const blocked=await executeTask(tampered,options);assert.equal(blocked.state,'BLOCKED_EXTERNAL_DEPENDENCY');assert.equal(blocked.evidence[0].reason,'capability_invocation_checksum_mismatch');
const unregistered={...task,capabilityArtifactInvocation:{...task.capabilityArtifactInvocation,adapter:'unknown.adapter'}};
const denied=await executeTask(unregistered,options);assert.equal(denied.state,'BLOCKED_PERMISSION');
console.log(JSON.stringify({ok:true,capabilityInvocation:'PASS',checksumGate:'PASS',provenanceGate:'PASS',authorizationGate:'PASS',independentVerification:'PASS'}));
