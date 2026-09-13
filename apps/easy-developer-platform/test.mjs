import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const projectName='V2 Test Workspace '+Date.now();
const child=spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:'8791'},stdio:'ignore'});
const base='http://127.0.0.1:8791';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=async(path,options)=>{const r=await fetch(base+path,options);let b={};try{b=await r.json()}catch{}return{status:r.status,body:b}};
const post=(path,body)=>json(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
try{
 await wait(350);
 let r=await json('/api/health');assert.equal(r.body.ok,true);assert.equal(r.body.version,'2.1.0');
 r=await json('/api/platform');assert.equal(r.body.group,'EASY Group');assert.equal(r.body.persistence,'atomic-json');assert.ok(r.body.modules.includes('auth'));assert.ok(r.body.modules.includes('approvals'));
 r=await json('/api/runtime');assert.equal(r.body.executionReady,false);assert.equal(r.body.deployReady,false);assert.equal(r.body.githubReady,false);
 r=await json('/api/registry');assert.ok(r.body.skills.length>=5);assert.ok(r.body.apis.length>=3);assert.ok(r.body.tools.length>=4);
 r=await post('/api/projects',{name:projectName,branch:'main'});assert.equal(r.status,201);const project=r.body.id;
 r=await post('/api/workspace/file',{project,path:'src/index.js',content:'const x = 1;'});assert.equal(r.status,201);
 r=await post('/api/workspace/file',{project,path:'src/secret.js',content:'api_key = "must-not-be-written"'});assert.equal(r.status,422);
 r=await json('/api/workspace/file?project='+project+'&path=src/index.js');assert.equal(r.body.content,'const x = 1;');
 r=await json('/api/workspace?project='+project);assert.ok(r.body.files.some(f=>f.path==='src/index.js'));
 r=await post('/api/tests/syntax',{project});assert.equal(r.body.decision,'pass');assert.equal(r.body.checkedFiles,1);
 r=await post('/api/agent/tasks',{project,prompt:'inspect project and propose safe improvements'});assert.equal(r.status,202);const taskId=r.body.id;
 r=await post('/api/agent/tasks/'+taskId+'/advance');assert.equal(r.body.status,'validated');
 r=await post('/api/agent/tasks/'+taskId+'/advance');assert.equal(r.body.status,'ready_for_execution');
 r=await post('/api/agent/tasks/'+taskId+'/advance');assert.equal(r.body.status,'execution_unavailable');
 r=await post('/api/builds',{project,purpose:'EASY v2 verification'});assert.equal(r.status,201);const buildId=r.body.id;
 r=await post('/api/builds/'+buildId+'/advance');assert.equal(r.body.status,'guarded');
 r=await post('/api/builds/'+buildId+'/advance');assert.equal(r.body.status,'tested');
 r=await post('/api/builds/'+buildId+'/advance');assert.equal(r.body.status,'preview_ready');
 r=await post('/api/builds/'+buildId+'/advance');assert.equal(r.body.status,'approval_required');assert.equal(r.body.gates.approval,'required');
 r=await post('/api/builds/approve',{buildId});assert.equal(r.body.status,'approved');
 r=await post('/api/builds/'+buildId+'/advance');assert.equal(r.body.status,'provider_unavailable');
 r=await post('/api/guardian/check',{content:'const x = 1;'});assert.equal(r.body.decision,'pass');
 r=await post('/api/guardian/check',{content:'api_key = "do-not-commit"'});assert.equal(r.body.decision,'block');
 r=await post('/api/tests/run');assert.equal(r.body.status,'passed');assert.equal(r.body.checks.length,14);
 r=await post('/api/deploy');assert.equal(r.status,409);assert.equal(r.body.reason,'deploy_provider_not_verified');
 console.log('EASY Developer Platform v2 self-test: PASS');
}finally{child.kill();}
