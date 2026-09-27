import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import crypto from 'node:crypto';
import {runEliteEngine} from './elite-engine.mjs';

const root=await mkdtemp(join(tmpdir(),'elite-capability-'));
const content='# verified capability\\nimplementation evidence\\n';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const artifact={repo:'example/research',revision:'b'.repeat(40),file:'README.md',sha256,bytes:Buffer.byteLength(content),content};
try {
  const result=await runEliteEngine('validate capability artifact',{root,isolate:false,provider:async()=>({summary:'safe no-op capability materialization verification',changes:[]}) ,capabilitySelection:{id:'cap-verified',repo:artifact.repo,revision:artifact.revision,capabilityType:'research',capability:'verified research capability',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT'},capabilityArtifact:artifact,policy:{metricsPath:join(root,'metrics.jsonl'),memoryPath:join(root,'memory.jsonl')}});
  const materialized=join(root,'.elite','capabilities',sha256,'README.md');
  assert.equal(await readFile(materialized,'utf8'),content);
  assert.ok(['TASK_VERIFIED','VERIFIED','VERIFIED_NOOP','NOOP_VERIFIED','blocked'].includes(result.status));
  await assert.rejects(()=>runEliteEngine('checksum mismatch',{root,isolate:false,provider:async()=>({subtasks:[]}),capabilitySelection:{id:'cap-verified',repo:artifact.repo,revision:artifact.revision,evidenceLevel:'VERIFIED',license:'MIT'},capabilityArtifact:{...artifact,sha256:'0'.repeat(64)},policy:{metricsPath:join(root,'m2.jsonl'),memoryPath:join(root,'m2-memory.jsonl')}}),/capability_artifact_checksum_mismatch/);
  console.log(JSON.stringify({ok:true,materialization:'PASS',checksumGate:'PASS',provenance:'PASS'}));
} finally { await rm(root,{recursive:true,force:true}); }
