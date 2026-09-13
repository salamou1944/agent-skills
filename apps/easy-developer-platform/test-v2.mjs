import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port=8792;
const child=spawn(process.execPath,['apps/easy-developer-platform/server-v2.mjs'],{env:{...process.env,PORT:String(port),EASY_API_KEY:'v2-test-key'},stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const req=async(path,options={})=>{const r=await fetch(base+path,{...options,headers:{authorization:'Bearer v2-test-key','content-type':'application/json',...(options.headers||{})}});return {status:r.status,body:await r.json()}};
try{
 await wait(300);
 let r=await fetch(base+'/api/health');let h=await r.json();assert.equal(h.ok,true);assert.equal(h.version,'2.0.0');
 r=await fetch(base+'/api/projects');assert.equal(r.status,401);
 r=await req('/api/platform');assert.equal(r.body.version,'2.0.0');assert.ok(r.body.modules.includes('auth'));assert.ok(r.body.modules.includes('approvals'));
 r=await req('/api/projects',{method:'POST',body:JSON.stringify({name:'V2 Verification',branch:'main'})});assert.equal(r.status,201);const project=r.body.id;
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project,path:'src/index.js',content:'const value = 1;'})});assert.equal(r.status,201);
 r=await req('/api/workspace/file',{method:'POST',body:JSON.stringify({project,path:'src/secret.js',content:'const api_key = "blocked";'})});assert.equal(r.status,422);
 r=await req('/api/guardian/workspace',{method:'POST',body:JSON.stringify({project})});assert.equal(r.body.decision,'pass');
 r=await req('/api/tests/syntax',{method:'POST',body:JSON.stringify({project})});assert.equal(r.body.decision,'pass');assert.equal(r.body.checkedFiles,1);
 r=await req('/api/builds',{method:'POST',body:JSON.stringify({project,purpose:'V2 gate verification'})});assert.equal(r.status,201);const build=r.body.id;
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'guarded');
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'tested');
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'preview_ready');
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'approval_required');
 r=await req('/api/builds/approve',{method:'POST',body:JSON.stringify({buildId:build})});assert.equal(r.status,200);assert.equal(r.body.status,'approved');
 r=await req('/api/builds/'+build+'/advance',{method:'POST'});assert.equal(r.body.status,'provider_unavailable');
 r=await req('/api/approvals');assert.ok(r.body.approvals.some(a=>a.buildId===build));
 r=await req('/api/tests/run',{method:'POST'});assert.equal(r.body.status,'passed');assert.equal(r.body.checks.length,14);
 r=await req('/api/deploy',{method:'POST',body:'{}'});assert.equal(r.status,409);assert.equal(r.body.status,'blocked');
 console.log('EASY Developer Platform v2 self-test: PASS');
}finally{child.kill();}
