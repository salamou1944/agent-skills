import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'operator-capability-worker-'));
const queue=path.join(root,'tasks');
const results=path.join(root,'results');
const ledger=path.join(root,'runs.jsonl');
await fs.mkdir(queue,{recursive:true});
await fs.mkdir(results,{recursive:true});
process.env.OPERATOR_RUN_LEDGER=ledger;

const {processNextTask}=await import('./worker.mjs');
const selected={id:'cap-verified',repo:'example/research',revision:'b'.repeat(40),capabilityType:'research',capability:'verified research capability',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT',compatibility:'node',dedupeKey:'example:research',artifact:{file:'src/capability.mjs'}};
await fs.writeFile(path.join(queue,'elite.json'),JSON.stringify({
  taskId:'elite-gated',idempotencyKey:'elite-gated',project:'test',goal:'safe verified task',
  priority:1,executionTarget:'elite',capabilityQuery:'verified research capability',
  capabilityCompatibility:'node',allowedLicenses:['MIT'],workspaceRoot:root
}));

let executedTask=null;
const result=await processNextTask({
  queueDir:queue,resultDir:results,
  selectCapability:async()=>({decision:'ADAPT_AND_VERIFY',selected,evidence:{selectedId:selected.id,sourceRevision:selected.revision,verificationStatus:selected.evidenceLevel}}),
  hydrateArtifact:async (selection,options)=>{assert.equal(options.file,'src/capability.mjs');return {ok:true,artifact:{repo:selection.repo,revision:selection.revision,file:options.file,url:'https://raw.githubusercontent.com/example/research/'+selection.revision+'/'+options.file,sha256:'a'.repeat(64),bytes:12,content:'verified capability artifact'}};},
  executeTaskImpl:async task=>{
    executedTask=task;
    return {state:'VERIFIED',completion:{ok:true},evidence:[
      {kind:'action',adapter:'elite-local-engine'},
      {kind:'verification',verifierId:'elite-test',passed:true},
      {kind:'independent_verification',verifierId:'elite-test',passed:true}
    ]};
  }
});
assert.equal(result.state,'VERIFIED');
assert.equal(executedTask.capabilitySelection.id,'cap-verified');
assert.equal(executedTask.capabilityArtifact.file,'src/capability.mjs');
assert.equal(executedTask.capabilityArtifact.content,'verified capability artifact');
assert.equal(executedTask.capabilitySelection.artifact.file,'src/capability.mjs');
assert.equal(executedTask.capabilitySelection.artifact.sha256,'a'.repeat(64));
assert.equal(executedTask.sourceRevision,'b'.repeat(40));
assert.equal(executedTask.requestedCapabilities.includes('research'),true);
assert.equal(executedTask.constraints.includes('capability-selected-verified'),true);
assert.equal((await fs.readdir(queue)).length,0);

const root2=await fs.mkdtemp(path.join(os.tmpdir(),'operator-capability-block-'));
const queue2=path.join(root2,'tasks'); const results2=path.join(root2,'results');
await fs.mkdir(queue2,{recursive:true}); await fs.mkdir(results2,{recursive:true});
await fs.writeFile(path.join(queue2,'blocked.json'),JSON.stringify({taskId:'blocked',idempotencyKey:'blocked',project:'test',goal:'must not execute',priority:1,executionTarget:'elite',capabilityQuery:'unverified'}));
let called=false;
const blocked=await processNextTask({
  queueDir:queue2,resultDir:results2,
  selectCapability:async()=>({decision:'BLOCKED_EXTERNAL_DEPENDENCY',selected:null,evidence:{query:'unverified'}}),
  executeTaskImpl:async()=>{called=true;return {state:'VERIFIED'};}
});
assert.equal(blocked.state,'BLOCKED_EXTERNAL_DEPENDENCY');
assert.equal(called,false);
assert.equal((await fs.readdir(queue2)).length,1);
console.log(JSON.stringify({ok:true,eliteSelection:'PASS',taskContract:'PASS',failClosed:'PASS'}));
