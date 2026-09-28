import assert from 'node:assert/strict';
import {resolveCapabilityInvocation,assertCapabilityInvocation} from './capability-invocation.mjs';

const registry={adapters:{
  'research.capability_sources':{
    status:'ADAPTER_READY',
    independentVerifier:'capability-sources-independent-verifier-v1'
  }
}};

const valid={id:'cap-verified',invocation:{
  mode:'adapter',adapter:'research.capability_sources',
  verifier:'capability-sources-independent-verifier-v1',artifactRole:'input'
}};

const resolved=await resolveCapabilityInvocation(valid,{registry});
assert.equal(resolved.ok,true);
assert.equal(resolved.binding.adapter,'research.capability_sources');
assert.equal(resolved.binding.verifier,'capability-sources-independent-verifier-v1');
const undeclared=await resolveCapabilityInvocation({id:'x'},{registry});
assert.equal(undeclared.reason,'capability_invocation_not_declared');
const unknown=await resolveCapabilityInvocation({id:'x',invocation:{mode:'adapter',adapter:'missing'}},{registry});
assert.equal(unknown.ok,false);
assert.equal(unknown.reason,'capability_adapter_not_registered');
const mismatch=await resolveCapabilityInvocation({id:'x',invocation:{mode:'adapter',adapter:'research.capability_sources',verifier:'wrong'}},{registry});
assert.equal(mismatch.ok,false);
assert.equal(mismatch.reason,'capability_verifier_mismatch');
assert.equal(assertCapabilityInvocation(resolved.binding,{task:{capabilitySelection:{id:'cap-verified'}}}),true);
console.log(JSON.stringify({ok:true,invocationBoundary:'PASS',registeredAdapterGate:'PASS',verifierBinding:'PASS',failClosed:'PASS'}));
