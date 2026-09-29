import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runEliteTask} from './elite-harness.mjs';

const root=await mkdtemp(join(tmpdir(),'elite-capability-invocation-'));
const capabilitySelection={
  id:'cap-verified',
  repo:'example/research',
  revision:'a'.repeat(40),
  evidenceLevel:'VERIFIED_FROM_SOURCE',
  license:'MIT'
};
let invoked=0;
let plannedContext='';
let plannedInvocation=null;
try {
  const result=await runEliteTask('use verified capability result in planning',{
    root,
    policy:{maxSteps:12,maxRepairs:0,requireReview:false,requireVerification:true},
    capabilitySelection,
    capabilityArtifact:{repo:'example/research',revision:'a'.repeat(40),file:'README.md',sha256:'b'.repeat(64),content:'verified'},
    invokeCapability:async ({capabilitySelection:selection})=>{
      invoked++;
      return {
        ok:true,
        result:{status:'200',sourceRevision:selection.revision,observed:'INVOCATION_RESULT'},
        evidence:{kind:'capability_invocation',passed:true,verifierId:'test-capability-invocation-verifier',sourceRevision:selection.revision}
      };
    },
    inspect:async()=>({context:'repo context'}),
    provider:async({role,context,capabilityInvocation})=>{
      if(role==='planner'){
        plannedContext=context;
        plannedInvocation=capabilityInvocation;
        return {summary:'consume invocation result',changes:[]};
      }
      throw new Error('unexpected_provider_role');
    },
    execute:async()=>({ok:true}),
    test:async()=>({ok:true}),
    verify:async()=>({ok:true,evidence:{kind:'verification',passed:true}}),
    journalPath:join(root,'journal.jsonl')
  });
  assert.equal(result.status,'TASK_VERIFIED');
  assert.equal(invoked,1);
  assert.match(plannedContext,/INVOCATION_RESULT/);
  assert.equal(plannedInvocation.result.status,'200');
  assert.equal(plannedInvocation.result.sourceRevision,'a'.repeat(40));
  assert.equal(result.evidence.some(x=>x.kind==='capability_invocation'&&x.passed===true),true);
  assert.equal(result.evidence.some(x=>x.verifierId==='test-capability-invocation-verifier'),true);
  console.log(JSON.stringify({ok:true,invocation:'PASS',planningConsumption:'PASS',evidence:'PASS',status:result.status}));
} finally {
  await rm(root,{recursive:true,force:true});
}
