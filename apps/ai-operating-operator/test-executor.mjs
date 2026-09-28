import assert from 'node:assert/strict';
import {executeTask} from './executor.mjs';

const fakeRunner=(command,args)=>{
  const listeners={};
  const child={
    stdout:{on:(event,fn)=>{listeners.out=fn}},
    stderr:{on:(event,fn)=>{listeners.err=fn}},
    on:(event,fn)=>{listeners[event]=fn},
    kill:()=>{},
  };
  queueMicrotask(()=>{listeners.out?.(Buffer.from('Nmap scan report for authorized-target\\n'));listeners.close?.(0,null);});
  return child;
};

const blocked=await executeTask(
  {project:'agent-skills',goal:'authorized nmap scan',requestedCapabilities:['security.network.nmap']},
  {capabilities:{'security.network.nmap':{authorized:true,reachable:false}},adapterInputs:{'security.network.nmap':{target:'authorized-target',allowlist:['authorized-target']}},runnerOverrides:{nmap:fakeRunner}}
);
assert.equal(blocked.state,'BLOCKED_EXTERNAL_DEPENDENCY');

const ready=await executeTask(
  {project:'agent-skills',goal:'authorized nmap scan',requestedCapabilities:['security.network.nmap']},
  {capabilities:{'security.network.nmap':{authorized:true,reachable:true}},adapterInputs:{'security.network.nmap':{target:'authorized-target',allowlist:['authorized-target']}},runnerOverrides:{nmap:fakeRunner}}
);
assert.equal(ready.state,'EVIDENCE_CAPTURED');
assert.equal(ready.verification.passed,true);
assert.equal(ready.completion.ok,true);
console.log('executor tests: PASS');


const artifactContent='verified skill instructions: summarize the task safely';
const artifactSha256='aeab9ae0a19f44817d7c15d2ff2f9c0fb1dec245b752e1bb722365f59b4b6d02';
const artifactRevision='b'.repeat(40);
const capabilityArtifact={repo:'example/superpowers',revision:artifactRevision,file:'skills/systematic-debugging/SKILL.md',sha256:artifactSha256,bytes:artifactContent.length,content:artifactContent};
const capabilitySelection={id:'cap-skill',repo:capabilityArtifact.repo,revision:artifactRevision,capabilityType:'skill',capability:'safe verified skill',evidenceLevel:'VERIFIED_FROM_SOURCE',license:'MIT',artifact:capabilityArtifact};
const capabilityArtifactInvocation={contractVersion:'capability-invocation-v1',mode:'prompt',adapter:'ai.local.ollama',action:'chat',artifact:{repo:capabilityArtifact.repo,revision:artifactRevision,file:capabilityArtifact.file,sha256:artifactSha256}};
let invocationInput=null;
const fakeOllama={runOllama:async input=>{invocationInput=input;return {executionId:'ollama-test-1',result:{status:200,ok:true,data:{message:{content:'invoked'}}}};}};
const fakeOllamaVerifier={verifyOllamaResult:({result})=>({verifierId:'ollama-test-verifier',passed:Boolean(result?.result?.ok),errors:[]})};

const invoked=await executeTask(
  {project:'agent-skills',goal:'Use verified systematic debugging skill',requestedCapabilities:['ai.local.ollama'],allowedActions:['capability_invoke'],capabilitySelection,capabilityArtifact,capabilityArtifactInvocation},
  {capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeOllama}},verifierOverrides:{'ai.local.ollama':fakeOllamaVerifier}}
);
assert.equal(invoked.completion.ok,true);
assert.equal(invoked.verification.passed,true);
assert.equal(invocationInput.action,'chat');
assert.equal(invocationInput.arguments.messages[1].content.includes(artifactContent),true);
assert.equal(invocationInput.task.capabilityArtifact.sha256,artifactSha256);
assert.equal(invoked.evidence.some(x=>x.kind==='independent_verification'&&x.verifierId==='ollama-test-verifier'),true);

const tampered=await executeTask(
  {...{project:'agent-skills',goal:'Use verified systematic debugging skill',requestedCapabilities:['ai.local.ollama'],allowedActions:['capability_invoke'],capabilitySelection,capabilityArtifact,capabilityArtifactInvocation},taskId:'tampered',capabilityArtifact:{...capabilityArtifact,content:'tampered'}},
  {capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeOllama}},verifierOverrides:{'ai.local.ollama':fakeOllamaVerifier}}
);
assert.equal(tampered.state,'BLOCKED_EXTERNAL_DEPENDENCY');

const unauthorized=await executeTask(
  {project:'agent-skills',goal:'Use verified systematic debugging skill',requestedCapabilities:['ai.local.ollama'],allowedActions:[],capabilitySelection,capabilityArtifact,capabilityArtifactInvocation},
  {capabilities:{'ai.local.ollama':{authorized:true,reachable:true}},adapterOverrides:{'ai.local.ollama':{entry:{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},module:fakeOllama}},verifierOverrides:{'ai.local.ollama':fakeOllamaVerifier}}
);
assert.equal(unauthorized.state,'BLOCKED_PERMISSION');
