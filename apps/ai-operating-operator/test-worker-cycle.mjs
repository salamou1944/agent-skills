import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'operator-worker-cycle-'));
const queue=path.join(root,'tasks');
const results=path.join(root,'results');
const ledger=path.join(root,'runs.jsonl');
await fs.mkdir(queue,{recursive:true});
await fs.mkdir(results,{recursive:true});
process.env.OPERATOR_RUN_LEDGER=ledger;

const {processNextTask}=await import('./worker.mjs');
const task=(taskId,priority)=>({taskId,idempotencyKey:taskId,project:'test',goal:`verify ${taskId}`,priority,createdAt:`2026-09-27T16:0${priority}:00.000Z`});
await fs.writeFile(path.join(queue,'low.json'),JSON.stringify(task('low',50)));
await fs.writeFile(path.join(queue,'high.json'),JSON.stringify(task('high',1)));

const calls=[];
const executeTaskImpl=async t=>{calls.push(t.taskId);return {state:'VERIFIED',completion:{ok:true},evidence:[{type:'action'},{type:'verification'},{type:'independent_verification'}]};};

const first=await processNextTask({queueDir:queue,resultDir:results,executeTaskImpl});
assert.equal(first.selected,'high.json');
assert.equal(first.state,'VERIFIED');
const second=await processNextTask({queueDir:queue,resultDir:results,executeTaskImpl});
assert.equal(second.selected,'low.json');
assert.equal(second.state,'VERIFIED');
const idle=await processNextTask({queueDir:queue,resultDir:results,executeTaskImpl});
assert.equal(idle.state,'IDLE');
assert.deepEqual(calls,['high','low']);
assert.equal((await fs.readdir(queue)).length,0);
const ledgerLines=(await fs.readFile(ledger,'utf8')).trim().split('\n').map(JSON.parse);
assert.equal(ledgerLines.some(x=>x.state==='VERIFIED'&&x.taskId==='high'),true);
assert.equal(ledgerLines.some(x=>x.state==='VERIFIED'&&x.taskId==='low'),true);
console.log(JSON.stringify({ok:true,selection:calls,terminal:'VERIFIED',idle:true}));
