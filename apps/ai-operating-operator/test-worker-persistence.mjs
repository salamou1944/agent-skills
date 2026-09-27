import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const root=await mkdtemp(join(tmpdir(),'operator-worker-'));
const ledger=join(root,'runs.jsonl');
const queue=join(root,'tasks');
await import('node:fs/promises').then(fs=>fs.mkdir(queue,{recursive:true}));
process.env.OPERATOR_RUN_LEDGER=ledger;
const {selectNextTask}=await import('./worker.mjs');
await writeFile(join(queue,'low.json'),JSON.stringify({taskId:'low',goal:'low',priority:50,createdAt:'2026-01-01T00:00:00Z'}));
await writeFile(join(queue,'high.json'),JSON.stringify({taskId:'high',goal:'high',priority:1,createdAt:'2026-01-02T00:00:00Z'}));
const selected=await selectNextTask(queue);
assert.equal(selected.task.taskId,'high');

const {createRun,updateRun,listRuns}=await import('./run-ledger.mjs');
const run=await createRun(selected.task);
assert.equal(run.state,'QUEUED');
await updateRun(run.runId,{state:'RUNNING',attempt:1});
await updateRun(run.runId,{state:'VERIFIED',completion:{ok:true}});
const persisted=await listRuns();
const saved=persisted.find(x=>x.runId===run.runId);
assert.equal(saved.state,'VERIFIED');
assert.equal(saved.completion.ok,true);
console.log(JSON.stringify({ok:true,nextTask:selected.task.taskId,persistedState:saved.state}));
await rm(root,{recursive:true,force:true});