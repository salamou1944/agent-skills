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

test('phase selection cannot skip unfinished work in that phase',()=>{
  const state={version:1,tasks:{},history:[]};
  assert.equal(selectNext(state,'easy').id,'easy.inspect-blocker');
  state.tasks['easy.inspect-blocker']={status:'VERIFIED'};
  assert.equal(selectNext(state,'easy').id,'easy.creative-engine');
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

test('queue workflow uses supported Copilot recovery rather than retired GitHub Models inference',async()=>{
  const workflow=await readFile('.github/workflows/elite-project-queue.yml','utf8');
  const prompt=await readFile('.github/prompts/elite-queue-copilot-fallback.txt','utf8');
  assert.match(workflow,/copilot-requests:\s*write/);
  assert.match(workflow,/Install Copilot CLI recovery/);
  assert.match(workflow,/copilot -s --no-ask-user/);
  assert.match(workflow,/response-file/);
  assert.doesNotMatch(workflow,/actions\/ai-inference@/);
  assert.doesNotMatch(workflow,/models\.github\.ai\/inference/);
  assert.match(prompt,/Return ONLY one JSON object/);
  assert.match(prompt,/Never modify \.github\/workflows/);
});
