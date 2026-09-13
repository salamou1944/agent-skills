import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const port=8792;
const root=await mkdtemp(join(tmpdir(),'easy-platform-v2-'));
const child=spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:String(port),EASY_API_KEY:'v2-test-key',EASY_WORKSPACE_DIR:join(root,'workspaces'),EASY_STATE_FILE:join(root,'state.json')},stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const req=async(path,options={})=>{const r=await fetch(base+path,{...options,headers:{authorization:'Bearer v2-test-key','content-type':'application/json',...(options.headers||{})}});const text=await r.text();let parsed;try{parsed=JSON.parse(text);}catch{parsed=text;}return {status:r.status,headers:r.headers,body:parsed};};
try{
 await wait(350);
 let r=await fetch(base+'/api/health');let h=await r.json();assert.equal(h.ok,true);assert.equal(h.version,'2.0.0');
 r=await fetch(base+'/api/projects');assert.equal(r.status,401);
 r=await fetch(base+'/api/projects',{headers:{authorization:'Bearer wrong'}});assert.equal(r.status,401);
 r=await req('/api/platform');assert.equal(r.body.version,'2.0.0');assert.ok(r.body.modules.includes('auth'));assert.ok(r.body.modules.includes('approvals'));
 r=await req('/');assert.equal(r.status,200);assert.match(String(r.body),/<!doctype html/i);assert.match(r.headers.get('content-type')||'',/text\/html/);
 r=await req('/api/projects',{method:'POST',body:JSON.stringify({name:'V2 Verification',branch:'main'})});assert.equal(r.status,201);const project=r.body.id;
 r=await req('/api/projects',{method:'POST',body:'{bad'});assert.equal(r.status,400);assert.equal(r.body.error,'invalid_json');
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project,path:'src/index.js',content:'const value = 1;'})});assert.equal(r.status,201);
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project,path:'../escape.js',content:'const escaped = true;'})});assert.equal(r.status,400);
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project:'missing-project',path:'x.js',content:'const x=1;'})});assert.equal(r.status,400);
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project,path:'src/secret.js',content:'const api_key = "blocked";'})});assert.equal(r.status,422);
 r=await req('/api/guardian/workspace',{method:'POST',body:JSON.stringify({project})});assert.equal(r.body.decision,'pass');
 r=await req('/api/tests/syntax',{method:'POST',body:JSON.stringify({project})});assert.equal(r.body.decision,'pass');assert.equal(r.body.checkedFiles,1);
 r=await req('/api/builds',{method:'POST',body:JSON.stringify({project,purpose:'V2 gate verification'})});assert.equal(r.status,201);const build=r.body.id;
 for(const expected of ['guarded','tested','preview_ready','approval_required']){r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,expected);}
 r=await req('/api/builds/approve',{method:'POST',body:JSON.stringify({buildId:build})});assert.equal(r.status,200);assert.equal(r.body.status,'approved');
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'provider_unavailable');
 r=await req('/api/approvals');assert.ok(r.body.approvals.some(a=>a.buildId===build));
 r=await req('/api/tests/run',{method:'POST'});assert.equal(r.body.status,'passed');assert.equal(r.body.checks.length,14);assert.ok(r.body.checks.every(c=>c.status==='passed'));
 r=await req('/api/checks/run',{method:'POST'});assert.equal(r.status,200);assert.equal(r.body.checks.length,14);
 r=await req('/api/deploy',{method:'POST',body:'{}'});assert.equal(r.status,409);assert.equal(r.body.status,'blocked');
 console.log('EASY Developer Platform v2 self-test: PASS');
}finally{child.kill();await rm(root,{recursive:true,force:true});}
