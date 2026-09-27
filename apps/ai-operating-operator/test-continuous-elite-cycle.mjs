import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'operator-continuous-'));
const workspace=join(root,'workspace');
const queue=join(root,'tasks');
const results=join(root,'results');
const ledger=join(root,'runs.jsonl');
await mkdir(workspace,{recursive:true});
await mkdir(queue,{recursive:true});
await mkdir(results,{recursive:true});
await exec('git',['init','-q'],{cwd:workspace});
await writeFile(join(workspace,'README.md'),'# continuous operator verification\n');
await exec('git',['add','README.md'],{cwd:workspace});
await exec('git',['-c','user.name=Operator Test','-c','user.email=operator-test@example.invalid','commit','-q','-m','fixture'],{cwd:workspace});
process.env.OPERATOR_RUN_LEDGER=ledger;
process.env.ELITE_LOCAL_ENGINE='1';
process.env.ELITE_ALLOWED_ROOT=workspace;

const {processNextTask}=await import('./worker.mjs');
const {listRuns}=await import('./run-ledger.mjs');

await writeFile(join(queue,'elite.json'),JSON.stringify({
  taskId:'continuous-elite',
  idempotencyKey:'continuous-elite',
  project:'ai-operating-operator',
  goal:'perform a safe verified no-op integration task',
  priority:1,
  executionTarget:'elite',
  workspaceRoot:workspace,
  allowedActions:['read']
}));

const provider=async()=>({summary:'safe no-op continuous verification',changes:[]});
const result=await processNextTask({
  queueDir:queue,
  resultDir:results,
  executeTaskImpl:async task=> {
    const {dispatchToElite}=await import('./elite-bridge.mjs');
    return dispatchToElite({...task,provider});
  }
});

assert.equal(result.state,'VERIFIED');
assert.equal(result.retry.retry,false);
assert.equal((await (await import('node:fs/promises')).readdir(queue)).length,0);
const persisted=await listRuns(20);
const run=persisted.find(x=>x.taskId==='continuous-elite');
assert.equal(run?.state,'VERIFIED');
assert.equal(run?.completion?.ok,true);
assert.equal(run?.evidence?.some(x=>x.kind==='action'),true);
assert.equal(run?.evidence?.some(x=>x.kind==='verification'),true);
assert.equal(run?.evidence?.some(x=>x.kind==='independent_verification'),true);
const saved=JSON.parse(await readFile(join(results,'elite.json'),'utf8'));
assert.equal(saved.completion?.ok,true);
console.log(JSON.stringify({ok:true,state:result.state,runState:run.state,completion:run.completion.ok,evidence:run.evidence.length}));
await rm(root,{recursive:true,force:true});
