import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const port=8793;
const root=await mkdtemp(join(tmpdir(),'easy-provider-boundary-'));
const child=spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:String(port),EASY_API_KEY:'provider-test',EASY_AGENT_PROVIDER:'fake-provider',EASY_GITHUB_PROVIDER:'fake-github',EASY_DEPLOY_PROVIDER:'fake-deploy',EASY_WORKSPACE_DIR:join(root,'workspaces'),EASY_STATE_FILE:join(root,'state.json')},stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
try {
  await new Promise(r=>setTimeout(r,350));
  const r=await fetch(base+'/api/runtime',{headers:{authorization:'Bearer provider-test'}});
  assert.equal(r.status,200);
  const x=await r.json();
  assert.equal(x.executionReady,false);
  assert.equal(x.githubReady,false);
  assert.equal(x.deployReady,false);
  assert.equal(x.agent.reason,'adapter_contract_not_verified');
  assert.equal(x.github.reason,'adapter_contract_not_verified');
  assert.equal(x.deploy.reason,'adapter_contract_not_verified');
  console.log('provider boundary: PASS');
} finally { child.kill(); await rm(root,{recursive:true,force:true}); }
