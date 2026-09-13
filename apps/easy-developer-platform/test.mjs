import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const projectName='Test Workspace '+Date.now();
const child=spawn(process.execPath,['apps/easy-developer-platform/server.mjs'],{env:{...process.env,PORT:'8791'},stdio:'ignore'});
const base='http://127.0.0.1:8791';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=(path,options)=>fetch(base+path,options).then(async r=>({status:r.status,body:await r.json()}));
try{
 await wait(250);
 let r=await json('/api/health');assert.equal(r.body.ok,true);assert.equal(r.body.version,'0.5.0');
 r=await json('/api/platform');assert.equal(r.body.group,'EASY Group');assert.equal(r.body.persistence,'file-backed');assert.ok(r.body.modules.includes('orchestration'));
 r=await json('/api/runtime');assert.equal(r.body.executionReady,false);assert.equal(r.body.deployReady,false);assert.equal(r.body.githubReady,false);
 r=await json('/api/registry');assert.ok(r.body.skills.length>=5);assert.ok(r.body.apis.length>=3);assert.ok(r.body.tools.length>=4);
 r=await json('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:projectName,branch:'main'})});assert.equal(r.status,201);
 const project=r.body.id;
 r=await json('/api/workspace/file',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,path:'src/index.js',content:'const x = 1;'})});assert.equal(r.status,201);
 r=await json('/api/workspace/file?project='+project+'&path=src/index.js');assert.equal(r.body.content,'const x = 1;');
 r=await json('/api/workspace?project='+project);assert.ok(r.body.files.some(f=>f.path==='src/index.js'));
 r=await json('/api/agent/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,prompt:'inspect project and propose safe improvements'})});assert.equal(r.status,202);assert.equal(r.body.status,'queued');
 const taskId=r.body.id;
 r=await json('/api/agent/tasks/'+taskId+'/advance',{method:'POST'});assert.equal(r.body.status,'validated');
 r=await json('/api/agent/tasks/'+taskId+'/advance',{method:'POST'});assert.equal(r.body.status,'ready_for_execution');
 r=await json('/api/agent/tasks/'+taskId+'/advance',{method:'POST'});assert.equal(r.body.status,'execution_unavailable');
 r=await json('/api/builds',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,purpose:'EASY build verification'})});assert.equal(r.status,201);assert.equal(r.body.status,'queued');
 const buildId=r.body.id;
 r=await json('/api/builds/'+buildId+'/advance',{method:'POST'});assert.equal(r.body.status,'guarded');assert.equal(r.body.gates.guardian,'pass');
 r=await json('/api/builds/'+buildId+'/advance',{method:'POST'});assert.equal(r.body.status,'tested');
 r=await json('/api/builds/'+buildId+'/advance',{method:'POST'});assert.equal(r.body.status,'preview_ready');
 r=await json('/api/builds/'+buildId+'/advance',{method:'POST'});assert.equal(r.body.status,'provider_unavailable');
 r=await json('/api/builds');assert.ok(r.body.builds.some(b=>b.id===buildId));
 r=await json('/api/guardian/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'const x = 1;'})});assert.equal(r.body.decision,'pass');
 r=await json('/api/guardian/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'api_key = "do-not-commit"'})});assert.equal(r.body.decision,'block');
 r=await json('/api/workspace/file',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project,path:'src/bad.js',content:'const api_key = "do-not-commit";'})});assert.equal(r.status,201);
 r=await json('/api/guardian/workspace',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project})});assert.equal(r.body.decision,'block');assert.ok(r.body.findings.some(f=>f.path==='src/bad.js'));
 r=await json('/api/tests/run',{method:'POST'});assert.equal(r.body.status,'passed');assert.equal(r.body.checks.length,13);
 r=await json('/api/deploy',{method:'POST'});assert.equal(r.status,409);assert.equal(r.body.reason,'deployment_provider_not_configured');
 console.log('EASY Developer Platform v0.5 self-test: PASS');
}finally{child.kill();}
