import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, selectNext, markTask } from './project-queue-orchestrator.mjs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mony=TASKS.filter(t=>t.phase==='mony');
const easy=TASKS.filter(t=>t.phase==='easy');

test('queue is mony-first and preserves ordered advancement',()=>{
  assert.ok(mony.length>0);
  assert.ok(easy.length>0);
  assert.ok(TASKS.findIndex(t=>t.phase==='easy') > TASKS.findIndex(t=>t.phase==='mony'));
  assert.equal(selectNext({version:1,tasks:{},history:[]}).id,'mony.payment-billing');
  const state={version:1,tasks:{'mony.payment-billing':{status:'VERIFIED'}},history:[]};
  assert.equal(selectNext(state).id,'mony.pipeline');
});

test('blocked or failed tasks stop advancement until verified',()=>{
  const state={version:1,tasks:{'mony.payment-billing':{status:'BLOCKED'}},history:[]};
  assert.equal(selectNext(state).id,'mony.payment-billing');
});

test('verified and noop tasks advance',()=>{
  const state={version:1,tasks:{'mony.payment-billing':{status:'NOOP'},'mony.pipeline':{status:'VERIFIED'}},history:[]};
  assert.equal(selectNext(state).id,'mony.reusable-services');
});

test('state writes retain evidence and history',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'elite-queue-'));
  const file=join(dir,'state.json');
  await markTask(file,'mony.payment-billing','VERIFIED',[{kind:'test',value:'passed'}]);
  const state=JSON.parse(await readFile(file,'utf8'));
  assert.equal(state.tasks['mony.payment-billing'].status,'VERIFIED');
  assert.equal(state.tasks['mony.payment-billing'].evidence[0].value,'passed');
  assert.equal(state.history.length,1);
});
