import assert from 'node:assert/strict';
import {evaluateCapabilityCandidate,selectVerifiedCapability} from './capability-selection.mjs';

const verified={id:'cap-1',repo:'example/tool',revision:'a'.repeat(40),capabilityType:'tool',capability:'local research tool',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT',securityNotes:'reviewed',compatibility:'node',dedupeKey:'example:tool'};
assert.deepEqual(evaluateCapabilityCandidate(verified),{eligible:true,reasons:[]});
assert.equal(evaluateCapabilityCandidate({...verified,id:'cap-2',license:'unresolved'}).eligible,false);
assert.equal(evaluateCapabilityCandidate({...verified,id:'cap-3',compatibility:'python'},{compatibility:'node'}).eligible,false);

const selected=await selectVerifiedCapability({query:'local research tool',search:async()=>[{...verified,id:'cap-2',license:'unresolved'},verified]});
assert.equal(selected.decision,'ADAPT_AND_VERIFY');
assert.equal(selected.selected.id,'cap-1');
assert.equal(selected.evidence.sourceRevision,'a'.repeat(40));
assert.equal(selected.selected.invocation,null);

const inv=await selectVerifiedCapability({query:'systematic debugging',search:async()=>[{id:'mufeedvh-superpowers-systematic-debugging',repo:'mufeedvh/superpowers',revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',capabilityType:'skill',capability:'systematic debugging',evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT'}]});
assert.equal(inv.selected.invocation.adapter,'ai.local.ollama');
assert.equal(inv.selected.invocation.contractVersion,'capability-invocation-v1');

const blocked=await selectVerifiedCapability({query:'unsafe candidate',search:async()=>[{...verified,id:'cap-4',evidenceLevel:'DISCOVERY_ONLY'}]});
assert.equal(blocked.selected,null);
assert.equal(blocked.decision,'BLOCKED_EXTERNAL_DEPENDENCY');

console.log(JSON.stringify({ok:true,selectionGate:'PASS',verifiedSelection:'PASS',invocationContract:'PASS',blockedUnverified:'PASS'}));
