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
assert.equal(blocked.state,'BLOCKED_PERMISSION');

const ready=await executeTask(
  {project:'agent-skills',goal:'authorized nmap scan',requestedCapabilities:['security.network.nmap']},
  {capabilities:{'security.network.nmap':{authorized:true,reachable:true}},adapterInputs:{'security.network.nmap':{target:'authorized-target',allowlist:['authorized-target']}},runnerOverrides:{nmap:fakeRunner}}
);
assert.equal(ready.state,'EVIDENCE_CAPTURED');
assert.equal(ready.verification.passed,true);
assert.equal(ready.completion.ok,true);
console.log('executor tests: PASS');
