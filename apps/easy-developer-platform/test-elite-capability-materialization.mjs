import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import crypto from 'node:crypto';
import {materializeCapabilityArtifact} from './elite-engine.mjs';

const root=await mkdtemp(join(tmpdir(),'elite-capability-'));
const content='# verified capability\\nimplementation evidence\\n';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const artifact={repo:'example/research',revision:'b'.repeat(40),file:'README.md',sha256,bytes:Buffer.byteLength(content),content};
try {
  const materializedResult=await materializeCapabilityArtifact(root,artifact);
  const materialized=join(root,'.elite','capabilities',sha256,'README.md');
  assert.equal(materializedResult.materializedPath,'.elite/capabilities/'+sha256+'/README.md');
  assert.equal(await readFile(materialized,'utf8'),content);
  await assert.rejects(()=>materializeCapabilityArtifact(root,{...artifact,sha256:'0'.repeat(64)}),/capability_artifact_checksum_mismatch/);
  await assert.rejects(()=>materializeCapabilityArtifact(root,{...artifact,repo:'../evil'}),/capability_artifact_provenance/);
  await assert.rejects(()=>materializeCapabilityArtifact(root,{...artifact,file:'../escape.md'}),/capability_artifact_path_invalid/);
  console.log(JSON.stringify({ok:true,materialization:'PASS',checksumGate:'PASS',provenance:'PASS',pathGuard:'PASS'}));
} finally { await rm(root,{recursive:true,force:true}); }
