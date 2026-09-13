import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspace=await mkdtemp(join(tmpdir(),'easy-operator-api-'));
const stateFile=join(workspace,'state.json');
const child=spawn(process.execPath,['apps/easy-developer-platform/operator-api.mjs'],{env:{...process.env,EASY_OPERATOR_PORT:'8793',EASY_OPERATOR_STATE:stateFile,EASY_OPERATOR_WORKSPACE:workspace},stdio:['ignore','pipe','pipe']});
const base='http://127.0.0.1:8793';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=async(path,options)=>{const r=await fetch(base+path,options);let b={};try{b=await r.json()}catch{}return{status:r.status,body:b}};
const post=(path,body)=>json(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
try{
 await wait(350);
 let r=await json('/api/operator/health');assert.equal(r.status,200);assert.equal(r.body.ok,true);
 r=await json('/api/operator/status');assert.equal(r.status,200);assert.equal(r.body.intelligence.providerConfigured,false);
 r=await post('/api/operator/tasks',{goal:'inspect workspace and verify syntax'});assert.equal(r.status,202);assert.equal(r.body.status,'QUEUED');
 r=await json('/api/operator/tasks');assert.equal(r.body.tasks.length,1);
 r=await post('/api/operator/run-once',{});assert.equal(r.status,200);assert.equal(r.body.result.status,'VERIFIED');
 r=await json('/api/operator/status');assert.equal(r.body.queue.verified,1);
 r=await post('/api/operator/github/execute',{owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'README.md',content:'x'}],approved:false});assert.equal(r.status,428);assert.equal(r.body.status,'WAITING_APPROVAL');
 r=await post('/api/operator/github/execute',{owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'.env',content:'x'}],approved:true,token:'test'});assert.equal(r.status,403);assert.equal(r.body.status,'BLOCKED');assert.equal(r.body.reason,'path_not_allowlisted');
 r=await post('/api/operator/github/execute',{owner:'salamou1944',repo:'agent-skills',title:'test',changes:[{path:'README.md',content:'x'}],approved:true});assert.equal(r.status,403);assert.equal(r.body.reason,'github_token_required');
 const secret=join(workspace,'secret.mjs');await writeFile(secret,'const api_key = "blocked";','utf8');
 r=await post('/api/operator/tasks',{goal:'inspect workspace'});assert.equal(r.status,202);
 r=await post('/api/operator/run-once',{});assert.equal(r.body.result.status,'BLOCKED');
 r=await post('/api/operator/tasks',{goal:'inspect workspace',project:'../outside'});assert.equal(r.status,400);assert.equal(r.body.error,'invalid_project');
 console.log('AI Operator control API self-test: PASS');
}finally{child.kill();await rm(workspace,{recursive:true,force:true});}
