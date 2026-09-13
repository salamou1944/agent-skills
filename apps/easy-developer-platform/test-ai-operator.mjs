import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execute, plan } from './ai-operator.mjs';

const workspace=await mkdtemp(join(tmpdir(),'easy-operator-'));
try{
  const p=plan('inspect this project');
  assert.equal(p.mode,'fail-closed');
  assert.ok(p.steps.includes('guardian_scan'));
  let r=await execute('inspect this project',{workspace});
  assert.equal(r.status,'VERIFIED');

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

  console.log('AI Operator kernel self-test: PASS');
}finally{await rm(workspace,{recursive:true,force:true});}
