import assert from 'node:assert/strict';
import test from 'node:test';
import {createTask,assessCapabilities,authorizeAction,nextState,evidence,verifyCompletion,capabilitySnapshot} from './operator-core.mjs';

test('fail closed task',()=>{const t=createTask({project:'Easy-',goal:'inspect',requestedCapabilities:['github']});assert.equal(t.state,'REQUESTED');assert.equal(t.completionClaimAllowed,false)});
test('token does not imply reachability',()=>{const t=createTask({goal:'inspect',requestedCapabilities:['github']});const x=assessCapabilities(t,{github:{authorized:true,reachable:false,canRead:true}});assert.equal(x.results[0].status,'BLOCKED_EXTERNAL_DEPENDENCY')});
test('write denied without permission',()=>{const t=createTask({goal:'change'});assert.equal(authorizeAction(t,'write',{authorized:true,canWrite:false}).state,'BLOCKED_PERMISSION')});
test('cannot skip verification',()=>{assert.equal(nextState('REQUESTED','authorize'),'AUTHORIZED');assert.throws(()=>nextState('PLANNED','verify'),/invalid_transition/)});
test('secrets sanitized',()=>{const e=evidence('action',{token:'secret',message:'Bearer abc'});assert.equal(e.token,'[REDACTED]');assert.match(e.message,/REDACTED/)});
test('independent evidence required',()=>{const t=createTask({goal:'test'});const r={taskId:t.taskId,state:'EVIDENCE_CAPTURED',verification:{passed:true},evidence:[{kind:'action'},{kind:'verification'}]};assert.equal(verifyCompletion(t,r).ok,false)});
test('configured token is not reachability proof',()=>{const s=capabilitySnapshot({GITHUB_TOKEN:'x',RAILWAY_TOKEN:'x',OPERATOR_WORKSPACE:'/tmp'});assert.equal(s.github.reachable,false);assert.equal(s.railway.reachable,false);assert.equal(s.local.reachable,true)});
