import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execute, plan } from './ai-operator.mjs';
import { createTask, loadState, saveState } from './operator-state.mjs';
import { runOnce, report } from './operator-worker.mjs';
import { TOOL_REGISTRY, inspectWorkspace, guardianScan, verifySyntax } from './operator-tools.mjs';
import { intelligenceStatus, planWithIntelligence } from './operator-intelligence.mjs';

const workspace=await mkdtemp(join(tmpdir(),'easy-operator-'));
const stateFile=join(workspace,'state.json');
const options={workspace,stateFile};
try{
  const p=plan('inspect this project');
  assert.equal(p.mode,'fail-closed');
  assert.ok(p.steps.includes('guardian_scan'));
  let r=await execute('inspect this project',{workspace});
  assert.equal(r.status,'VERIFIED');

  const inspected=await inspectWorkspace(workspace);
  assert.equal(inspected.ok,true);
  assert.ok(TOOL_REGISTRY.includes('syntax_verification'));
  assert.equal((await guardianScan(workspace)).ok,true);
  assert.equal((await verifySyntax(workspace)).ok,true);

  const intelligence=intelligenceStatus({});
  assert.equal(intelligence.providerConfigured,false);
  const modelPlan=await planWithIntelligence('inspect this project',{env:{}});
  assert.equal(modelPlan.intelligence.status,'UNAVAILABLE');

  await writeFile(join(workspace,'broken.mjs'),'const = 1;');
  r=await execute('inspect this project',{workspace});
  assert.equal(r.status,'FAILED');

  await rm(join(workspace,'broken.mjs'));
  await writeFile(join(workspace,'secret.mjs'),'const api_key = "blocked";');
  r=await execute('inspect this project',{workspace});
  assert.equal(r.status,'BLOCKED');

  await rm(join(workspace,'secret.mjs'));
  r=await execute('deploy this project',{workspace});
  assert.equal(r.status,'BLOCKED');
  r=await execute('deploy this project',{workspace,allowHighRisk:true});
  assert.equal(r.status,'VERIFIED');

  const task=createTask('inspect queued project');
  const state=await saveState(stateFile,{version:1,tasks:[task]});
  assert.equal(state.tasks.length,1);
  const workerResult=await runOnce(options);
  assert.ok(workerResult && workerResult.status==='VERIFIED');
  const final=await loadState(stateFile);
  assert.equal(final.tasks[0].status,'VERIFIED');
  assert.equal(report(final).totals.queued,0);

  console.log('AI Operator kernel + queue/tools/intelligence self-test: PASS');
}finally{await rm(workspace,{recursive:true,force:true});}
