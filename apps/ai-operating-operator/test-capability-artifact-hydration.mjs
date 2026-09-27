import assert from 'node:assert/strict';
import {hydrateCapabilityArtifact} from './worker.mjs';

const selection={id:'cap',repo:'example/research',revision:'b'.repeat(40)};
const ok=await hydrateCapabilityArtifact(selection,{fetchImpl:async url=>({ok:true,status:200,text:async()=> 'artifact'})});
assert.equal(ok.ok,true);
assert.equal(ok.artifact.repo,'example/research');
assert.equal(ok.artifact.revision,'b'.repeat(40));
assert.equal(ok.artifact.file,'README.md');
assert.equal(ok.artifact.sha256.length,64);

const badRevision=await hydrateCapabilityArtifact({...selection,revision:'main'},{fetchImpl:async()=>({ok:true,status:200,text:async()=>''})});
assert.equal(badRevision.ok,false);
assert.equal(badRevision.state,'BLOCKED_EXTERNAL_DEPENDENCY');

const traversal=await hydrateCapabilityArtifact(selection,{file:'../secret',fetchImpl:async()=>({ok:true,status:200,text:async()=>''})});
assert.equal(traversal.ok,false);
assert.equal(traversal.state,'BLOCKED_PERMISSION');

console.log(JSON.stringify({ok:true,artifactHydration:'PASS',pinnedRevision:'PASS',pathGuard:'PASS'}));
