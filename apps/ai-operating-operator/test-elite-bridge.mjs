import assert from 'node:assert/strict';
import {dispatchToElite,getEliteBridgeStatus} from './elite-bridge.mjs';

const calls=[];
const fakeFetch=async(url,options)=>{
  calls.push({url:String(url),options});
  return new Response(JSON.stringify({
    state:'VERIFIED',
    verification:{verifierId:'elite-independent-verifier-v1',passed:true,errors:[]},
    evidence:[{kind:'action',adapter:'elite',accepted:true},{kind:'verification',verifierId:'elite-independent-verifier-v1',passed:true},{kind:'independent_verification',verifierId:'elite-independent-verifier-v1',passed:true}]
  }),{status:200,headers:{'content-type':'application/json'}});
};

const oldUrl=process.env.ELITE_EXECUTOR_URL;
const oldToken=process.env.ELITE_EXECUTOR_TOKEN;
process.env.ELITE_EXECUTOR_URL='https://elite.example.test/execute';
process.env.ELITE_EXECUTOR_TOKEN='test-token';

const status=getEliteBridgeStatus();
assert.equal(status.configured,true);
assert.equal(status.authorized,true);

const capabilitySelection={id:'cap-verified',repo:'example/research',revision:'b'.repeat(40),capabilityType:'research',capability:'verified research capability',evidenceLevel:'VERIFIED_FROM_README_LICENSE',license:'MIT',compatibility:'node',dedupeKey:'example:research'};

const result=await dispatchToElite({
  project:'ai-operating-operator',
  goal:'verify elite bridge',
  requestedCapabilities:['elite.execution'],
  allowedActions:['read'],
  capabilitySelection
},{fetchImpl:fakeFetch});

assert.equal(result.taskId.length>0,true);
assert.equal(result.evidence.some(x=>x.kind==='elite_dispatch'),true);
assert.equal(result.completion.ok,true);
assert.equal(calls.length,1);
assert.equal(JSON.parse(calls[0].options.body).protocol,'ai-operating-elite-v1');
assert.equal(calls[0].options.headers.authorization,'Bearer test-token');
assert.equal(JSON.parse(calls[0].options.body).task.capabilitySelection.id,'cap-verified');

if(oldUrl===undefined) delete process.env.ELITE_EXECUTOR_URL; else process.env.ELITE_EXECUTOR_URL=oldUrl;
if(oldToken===undefined) delete process.env.ELITE_EXECUTOR_TOKEN; else process.env.ELITE_EXECUTOR_TOKEN=oldToken;
console.log(JSON.stringify({ok:true,taskId:result.taskId,completion:result.completion}));
