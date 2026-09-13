import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const child = spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:'8791'},stdio:'ignore'});
const base='http://127.0.0.1:8791';
try {
  await new Promise(r=>setTimeout(r,150));
  const health=await fetch(base+'/api/health').then(r=>r.json());
  assert.equal(health.ok,true);
  const platform=await fetch(base+'/api/platform').then(r=>r.json());
  assert.deepEqual(platform.modules,['projects','agent','skills','apis','tools','github','guardian','tests','preview']);
  const project=await fetch(base+'/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'EASY Core',branch:'feat/code-guardian-v1'})}).then(r=>r.json());
  assert.equal(project.name,'EASY Core');
  const check=await fetch(base+'/api/checks/run',{method:'POST'}).then(r=>r.json());
  assert.equal(check.status,'passed');
  console.log('EASY Developer Platform self-test: PASS');
} finally { child.kill(); }
