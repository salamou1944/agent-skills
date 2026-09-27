import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {dispatchToElite} from './elite-bridge.mjs';

const exec=promisify(execFile);
const root=await mkdtemp(join(tmpdir(),'elite-bridge-'));
const oldMode=process.env.ELITE_LOCAL_ENGINE;
const oldAllowed=process.env.ELITE_ALLOWED_ROOT;
try{
  await exec('git',['init','-q'],{cwd:root});
  await writeFile(join(root,'README.md'),'# deterministic elite integration\n');
  await exec('git',['add','README.md'],{cwd:root});
  await exec('git',['-c','user.name=Elite Test','-c','user.email=elite-test@example.invalid','commit','-q','-m','fixture'],{cwd:root});
  process.env.ELITE_LOCAL_ENGINE='1';
  process.env.ELITE_ALLOWED_ROOT=root;
  const provider=async()=>({summary:'safe no-op integration verification',changes:[]});
  const result=await dispatchToElite({project:'ai-operating-operator',goal:'perform a safe verified no-op integration task',workspaceRoot:root,allowedActions:['read'],provider});
  assert.equal(result.result?.status,'TASK_VERIFIED');
  assert.equal(result.verification?.passed,true);
  assert.equal(result.evidence.some(x=>x.kind==='action'),true);
  assert.equal(result.evidence.some(x=>x.kind==='verification'),true);
  assert.equal(result.evidence.some(x=>x.kind==='independent_verification'),true);
  assert.equal(result.completion.ok,true);
  console.log(JSON.stringify({ok:true,state:result.result.status,completion:result.completion}));
}finally{
  if(oldMode===undefined) delete process.env.ELITE_LOCAL_ENGINE; else process.env.ELITE_LOCAL_ENGINE=oldMode;
  if(oldAllowed===undefined) delete process.env.ELITE_ALLOWED_ROOT; else process.env.ELITE_ALLOWED_ROOT=oldAllowed;
  await rm(root,{recursive:true,force:true});
}