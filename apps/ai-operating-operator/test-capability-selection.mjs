import assert from 'node:assert/strict';
import {evaluateCapabilityCandidate,selectVerifiedCapability} from './capability-selection.mjs';

const verified={id:'cap-1',repo:'example/tool',revision:'a'.repeat(40),capabilityType:'tool',capability:'local research tool',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT',securityNotes:'reviewed',compatibility:'node',dedupeKey:'example:tool',invocation:{contractVersion:'capability-invocation-v1',mode:'prompt',adapter:'ai.local.ollama',action:'chat'}};
assert.equal(evaluateCapabilityCandidate(verified,{registeredAdapterIds:new Set(['ai.local.ollama'])}).eligible,true);
assert.equal(evaluateCapabilityCandidate({...verified,id:'cap-2',license:'unresolved'},{registeredAdapterIds:new Set(['ai.local.ollama'])}).eligible,false);
assert.equal(evaluateCapabilityCandidate({...verified,id:'cap-3',compatibility:'python'},{compatibility:'node',registeredAdapterIds:new Set(['ai.local.ollama'])}).eligible,false);

const selected=await selectVerifiedCapability({query:'local research tool',registeredAdapterIds:new Set(['ai.local.ollama']),search:async()=>[{...verified,id:'cap-2',license:'unresolved'},verified]});
assert.equal(selected.decision,'ADAPT_AND_VERIFY');
assert.equal(selected.selected.id,'cap-1');
assert.equal(selected.evidence.sourceRevision,'a'.repeat(40));

const blocked=await selectVerifiedCapability({query:'unsafe candidate',registeredAdapterIds:new Set(['ai.local.ollama']),search:async()=>[{...verified,id:'cap-4',evidenceLevel:'DISCOVERY_ONLY'}]});
assert.equal(blocked.selected,null);
assert.equal(blocked.decision,'BLOCKED_EXTERNAL_DEPENDENCY');

console.log(JSON.stringify({ok:true,selectionGate:'PASS',verifiedSelection:'PASS',blockedUnverified:'PASS'}));
