import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {executeTask} from './executor.mjs';

const content='verified capability fixture';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const revision='0123456789abcdef0123456789abcdef01234567';
const invocation={mode:'artifact_read',adapter:'capability.artifact',verifier:'capability-artifact-independent-verifier-v1',contractVersion:'capability-invocation-v1'};
const result=await executeTask({
  goal:'invoke a verified capability artifact through the controlled execution boundary',
  requestedCapabilities:['capability.artifact'],
  allowedActions:['capability_invoke'],
  capabilitySelection:{
    id:'verified-fixture',
    repo:'example/repo',
    revision,
    capabilityType:'skill',
    evidenceLevel:'VERIFIED_FROM_SOURCE',
    license:'MIT',
    artifact:{sha256},
    invocation
  },
  capabilityArtifact:{repo:'example/repo',revision,file:'SKILL.md',sha256,bytes:content.length,content},
  capabilityArtifactInvocation:{...invocation,artifact:{repo:'example/repo',revision,file:'SKILL.md',sha256}}
},{
  capabilities:{'capability.artifact':{authorized:true,reachable:true}},
  adapters:{'capability.artifact':{status:'ADAPTER_READY'}}
});
assert.equal(result.state,'EVIDENCE_CAPTURED');
assert.equal(result.verification.passed,true);
assert.equal(result.evidence.some(x=>x.kind==='action'&&x.adapter==='capability.artifact'),true);
assert.equal(result.evidence.some(x=>x.kind==='independent_verification'&&x.passed===true),true);
console.log(JSON.stringify({ok:true,state:result.state,invocation:'PASS',independentVerification:'PASS'}));
