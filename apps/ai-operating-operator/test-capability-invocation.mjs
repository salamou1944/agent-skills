import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {executeTask} from './executor.mjs';

const content='Verified systematic-debugging skill: trace the root cause, reproduce it, patch the smallest safe change, then verify independently.';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
let invoked=false;
let received=null;
const fakeAdapter={
  async runCapabilityArtifact(input){invoked=true;received=input;return {executionId:'fake-capability-invocation-1',target:'mufeedvh/superpowers:skills/systematic-debugging/SKILL.md',result:{status:200,mode:'artifact_read',invoked:true,sourceRevision:input.task.capabilityArtifact.revision,sha256:input.task.capabilityArtifact.sha256,bytes:Buffer.byteLength(content,'utf8')}};},
  verifyCapabilityArtifactResult:({result})=>({verifierId:'capability-artifact-independent-verifier-v1',passed:Boolean(result?.result?.invoked===true),errors:[]})
};
const task={
  taskId:'capability-invocation-test',goal:'Apply the verified systematic debugging skill to this task.',project:'test',allowedActions:['capability_invoke'],requestedCapabilities:['capability.artifact'],
  capabilitySelection:{id:'mufeedvh-superpowers-systematic-debugging',repo:'mufeedvh/superpowers',revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',capabilityType:'skill',capability:'systematic debugging',artifact:{sha256},invocation:{mode:'artifact_read',adapter:'capability.artifact',verifier:'capability-artifact-independent-verifier-v1',contractVersion:'capability-invocation-v1'}},
  capabilityArtifact:{repo:'mufeedvh/superpowers',revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',file:'skills/systematic-debugging/SKILL.md',sha256,content},
  capabilityArtifactInvocation:{mode:'artifact_read',adapter:'capability.artifact',verifier:'capability-artifact-independent-verifier-v1',contractVersion:'capability-invocation-v1',artifact:{repo:'mufeedvh/superpowers',revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',file:'skills/systematic-debugging/SKILL.md',sha256}}
};
const result=await executeTask(task,{capabilities:{'capability.artifact':{authorized:true,reachable:true}},adapterOverrides:{'capability.artifact':{entry:{status:'ADAPTER_READY',independentVerifier:'capability-artifact-independent-verifier-v1'},module:fakeAdapter}},verifierOverrides:{'capability.artifact':fakeAdapter}});
assert.equal(invoked,true);assert.equal(received.task.capabilityArtifact.content,content);assert.equal(result.state,'EVIDENCE_CAPTURED');assert.equal(result.completion.ok,true);assert.equal(result.verification.verifierId,'capability-artifact-independent-verifier-v1');
const tampered={...task,capabilityArtifact:{...task.capabilityArtifact,content:content+' tampered'}};const blocked=await executeTask(tampered,{capabilities:{'capability.artifact':{authorized:true,reachable:true}},adapterOverrides:{'capability.artifact':{entry:{status:'ADAPTER_READY',independentVerifier:'capability-artifact-independent-verifier-v1'},module:fakeAdapter}},verifierOverrides:{'capability.artifact':fakeAdapter}});assert.equal(blocked.state,'BLOCKED_EXTERNAL_DEPENDENCY');assert.equal(blocked.evidence[0].reason,'capability_invocation_checksum_mismatch');
const unregistered={...task,capabilityArtifactInvocation:{...task.capabilityArtifactInvocation,adapter:'unknown.adapter'}};const denied=await executeTask(unregistered,{capabilities:{'capability.artifact':{authorized:true,reachable:true}}});assert.equal(denied.state,'BLOCKED_PERMISSION');
console.log(JSON.stringify({ok:true,capabilityInvocation:'PASS',checksumGate:'PASS',provenanceGate:'PASS',authorizationGate:'PASS',independentVerification:'PASS'}));
