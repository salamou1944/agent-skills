import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {hydrateCapabilityArtifact} from './worker.mjs';

const selection={id:'cap',repo:'example/research',revision:'b'.repeat(40)};
const content='export const verified=true;\n';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const ok=await hydrateCapabilityArtifact(selection,{file:'src/capability.mjs',expectedSha256:sha256,fetchImpl:async url=>{
  assert.equal(url,'https://raw.githubusercontent.com/example/research/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/src/capability.mjs');
  return {ok:true,status:200,text:async()=>content};
}});
assert.equal(ok.ok,true);
assert.equal(ok.artifact.repo,'example/research');
assert.equal(ok.artifact.revision,'b'.repeat(40));
assert.equal(ok.artifact.file,'src/capability.mjs');
assert.equal(ok.artifact.sha256,sha256);

const checksumMismatch=await hydrateCapabilityArtifact(selection,{file:'src/capability.mjs',expectedSha256:'0'.repeat(64),fetchImpl:async()=>({ok:true,status:200,text:async()=>content})});
assert.equal(checksumMismatch.ok,false);
assert.equal(checksumMismatch.state,'BLOCKED_EXTERNAL_DEPENDENCY');
assert.equal(checksumMismatch.reason,'artifact_checksum_mismatch');

const badRevision=await hydrateCapabilityArtifact({...selection,revision:'main'},{fetchImpl:async()=>({ok:true,status:200,text:async()=>''})});
assert.equal(badRevision.ok,false);
assert.equal(badRevision.state,'BLOCKED_EXTERNAL_DEPENDENCY');

const traversal=await hydrateCapabilityArtifact(selection,{file:'../secret',fetchImpl:async()=>({ok:true,status:200,text:async()=>''})});
assert.equal(traversal.ok,false);
assert.equal(traversal.state,'BLOCKED_PERMISSION');

console.log(JSON.stringify({ok:true,artifactHydration:'PASS',implementationFile:'PASS',expectedChecksum:'PASS',pinnedRevision:'PASS',pathGuard:'PASS'}));
