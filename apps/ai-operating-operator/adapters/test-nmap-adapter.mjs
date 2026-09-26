import assert from 'node:assert/strict';
import { buildNmapArgs, validateTarget } from './nmap-adapter.mjs';
assert.throws(()=>validateTarget('127.0.0.1',[]),/target_not_authorized/);
assert.deepEqual(buildNmapArgs({target:'127.0.0.1',allowlist:['127.0.0.1'],ports:'80,443',serviceDetection:true}),['-Pn','-n','-p','80,443','-sV','127.0.0.1']);
assert.throws(()=>buildNmapArgs({target:'127.0.0.1',allowlist:['127.0.0.1'],ports:'80;rm'}),/ports_format_rejected/);
console.log('nmap adapter validation: PASS');
