import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'operator-worker-recovery-'));
process.env.OPERATOR_RUN_LEDGER=path.join(root,'runs.jsonl');
const {createRun,updateRun,recoverInterruptedRuns,listRuns}=await import('./run-ledger.mjs');
const task={taskId:'interrupted',idempotencyKey:'interrupted',goal:'recover'};
const run=await createRun(task);
await updateRun(run.runId,{state:'RUNNING',attempt:1});
const count=await recoverInterruptedRuns();
assert.equal(count,1);
const recovered=await listRuns();
const saved=recovered.find(x=>x.runId===run.runId);
assert.equal(saved.state,'FAILED');
assert.equal(saved.failure.class,'process_restart');
console.log(JSON.stringify({ok:true,recovered:count,state:saved.state,failure:saved.failure.class}));
