import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {evaluateCapabilityCandidate,selectVerifiedCapability} from './capability-selection.mjs';
import {executeTask} from './executor.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const executorSource=await fs.readFile(path.join(ROOT,'executor.mjs'),'utf8');
assert.equal(/\beval\s*\(/.test(executorSource),false,'executor must not eval repository artifacts');
assert.equal(/\bimport\s*\(/.test(executorSource),false,'executor must not dynamically import repository artifacts');

const revision='a'.repeat(40);
const content='verified capability guidance; malicious-looking text must remain data: eval("DO_NOT_RUN")';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const base={id:'cap-verified',repo:'example/superpowers',revision,capabilityType:'skill',capability:'verified skill',evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',artifact:{file:'skills/demo/SKILL.md',sha256},invocation:{contractVersion:'capability-invocation-v1',mode:'prompt',adapter:'ai.local.ollama',action:'chat'}};

const ready=evaluateCapabilityCandidate(base,{registeredAdapterIds:new Set(['ai.local.ollama'])});
assert.equal(ready.eligible,true);
assert.equal(ready.invocationStatus,'ADAPTER_READY');
assert.equal(ready.adapterId,'ai.local.ollama');

const noAdapter=evaluateCapabilityCandidate({...base,invocation:null},{registeredAdapterIds:new Set(['ai.local.ollama'])});
assert.equal(noAdapter.eligible,false);
assert.equal(noAdapter.invocationStatus,'DISCOVERY_ONLY');

const unknownAdapter=evaluateCapabilityCandidate({...base,invocation:{...base.invocation,adapter:'unregistered.adapter'}},{registeredAdapterIds:new Set(['ai.local.ollama'])});
assert.equal(unknownAdapter.eligible,false);
assert.equal(unknownAdapter.invocationStatus,'DISCOVERY_ONLY');

const selected=await selectVerifiedCapability({
  query:'verified skill',
  registeredAdapterIds:new Set(['ai.local.ollama']),
  search:async()=>[{...base},{...base,id:'cap-discovery',invocation:null}]
});
assert.equal(selected.decision,'ADAPT_AND_VERIFY');
assert.equal(selected.selected.invocationStatus,'ADAPTER_READY');
assert.equal(selected.selected.invocation.adapter,'ai.local.ollama');

const discovery=await selectVerifiedCapability({
  query:'unadapted',
  registeredAdapterIds:new Set(['ai.local.ollama']),
  search:async()=>[{...base,id:'cap-discovery',invocation:null}]
});
assert.equal(discovery.decision,'DISCOVERY_ONLY');
assert.equal(discovery.selected.invocationStatus,'DISCOVERY_ONLY');

let received=null;
let verified=false;
const fakeAdapter={
  runOllama:async input=>{received=input;return {executionId:'e2e-ollama',result:{status:200,ok:true,data:{message:{content:'bounded adapter output'}}}};}
};
const fakeVerifier={
  verifyOllamaResult:({result})=>{verified=true;return {verifierId:'e2e-independent-verifier',passed:result?.result?.ok===true,errors:[]};}
};
const artifact={repo:base.repo,revision,file:base.artifact.file,sha256,bytes:Buffer.byteLength(content,'utf8'),content};
const invoked=await executeTask(
  {taskId:'capability-invocation-contract-e2e',project:'agent-skills',goal:'invoke verified capability',requestedCapabilities:['ai.local.ollama'],allowedActions:['capability_invoke'],capabilitySelection:base,capabilityArtifact:artifact,capabilityArtifactInvocation:base.invocation},
  {capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeAdapter}},verifierOverrides:{'ai.local.ollama':fakeVerifier}}
);
assert.equal(invoked.completion.ok,true);
assert.equal(received.arguments.messages[1].content,content);
assert.equal(verified,true);
assert.equal(invoked.evidence.some(x=>x.kind==='independent_verification'&&x.verifierId==='e2e-independent-verifier'),true);

const blocked=await executeTask(
  {taskId:'capability-invocation-contract-unregistered',project:'agent-skills',goal:'reject unregistered adapter',requestedCapabilities:['ai.local.ollama'],allowedActions:['capability_invoke'],capabilitySelection:base,capabilityArtifact:artifact,capabilityArtifactInvocation:{...base.invocation,adapter:'evil.unregistered'}},
  {capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeAdapter}},verifierOverrides:{'ai.local.ollama':fakeVerifier}}
);
assert.equal(blocked.state,'BLOCKED_PERMISSION');
assert.equal(blocked.evidence[0].reason,'capability_invocation_adapter_not_registered');

console.log('capability invocation contract E2E: PASS');
