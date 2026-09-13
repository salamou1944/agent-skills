import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const child=spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:'8791'},stdio:'ignore'});
const base='http://127.0.0.1:8791';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=(path,options)=>fetch(base+path,options).then(async r=>({status:r.status,body:await r.json()}));
try{
 await wait(200);
 let r=await json('/api/health');assert.equal(r.body.ok,true);assert.equal(r.body.version,'0.2.0');
 r=await json('/api/platform');assert.equal(r.body.group,'EASY Group');assert.ok(r.body.modules.includes('workspace'));assert.ok(r.body.modules.includes('deploy'));
 r=await json('/api/registry');assert.ok(r.body.skills.length>=5);assert.ok(r.body.apis.length>=3);assert.ok(r.body.tools.length>=4);
 r=await json('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Test Workspace',branch:'main'})});assert.equal(r.status,201);
 const project=r.body.id;
 r=await json('/api/workspace/file',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,path:'README.md',content:'# test'})});assert.equal(r.status,201);
 r=await json('/api/workspace/file?project='+project+'&path=README.md');assert.equal(r.body.content,'# test');
 r=await json('/api/agent/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,prompt:'inspect project and propose safe improvements'})});assert.equal(r.status,202);assert.equal(r.body.status,'queued');
 r=await json('/api/guardian/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'const x = 1;'})});assert.equal(r.body.decision,'pass');
 r=await json('/api/guardian/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'api_key = "do-not-commit"'})});assert.equal(r.body.decision,'block');
 r=await json('/api/checks/run',{method:'POST'});assert.equal(r.body.status,'passed');assert.equal(r.body.checks.length,10);
 console.log('EASY Developer Platform v0.2 self-test: PASS');
}finally{child.kill();}
