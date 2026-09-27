import assert from 'node:assert/strict';
import {validateCapabilitySelection} from './elite-engine.mjs';

const verified={id:'cap-verified',repo:'example/research',revision:'b'.repeat(40),capabilityType:'research',capability:'verified research capability',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT'};
assert.deepEqual(validateCapabilitySelection(verified).ok,true);
assert.equal(validateCapabilitySelection({...verified,evidenceLevel:'DISCOVERY_ONLY'}).ok,false);
assert.equal(validateCapabilitySelection({...verified,license:'unresolved'}).ok,false);
assert.equal(validateCapabilitySelection(null).ok,true);
console.log(JSON.stringify({ok:true,eliteCapabilityContract:'PASS',failClosed:'PASS'}));
