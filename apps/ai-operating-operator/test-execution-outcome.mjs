import assert from 'node:assert/strict';
import {evaluateExecutionOutcome,buildReplanDecision} from './execution-outcome.mjs';

const verified=evaluateExecutionOutcome({
  state:'VERIFIED',
  completion:{ok:true},
  evidence:[{type:'action'},{type:'independent_verification'}]
});
assert.equal(verified.state,'VERIFIED');
assert.equal(verified.outcome,'VERIFIED_OUTCOME');
assert.equal(verified.independentlyVerified,true);

const forged=evaluateExecutionOutcome({
  state:'VERIFIED',
  completion:{ok:true},
  evidence:[{type:'action'}]
});
assert.equal(forged.state,'VERIFICATION_FAILED');
assert.equal(forged.outcome,'VERIFICATION_FAILED');

const blocked=evaluateExecutionOutcome({
  state:'BLOCKED_EXTERNAL_DEPENDENCY',
  completion:{ok:false},
  failure:{class:'external_dependency'}
});
assert.equal(blocked.outcome,'BLOCKED_EXTERNAL');

assert.deepEqual(
  buildReplanDecision({state:'VERIFIED',completion:{ok:true},evidence:[{type:'action'},{type:'independent_verification'}]},{nextTaskId:'next-1'}),
  {decision:'NEXT_TASK',sourceState:'VERIFIED',nextTaskId:'next-1'}
);
console.log(JSON.stringify({ok:true,verified:true,forgedSuccessRejected:true,blockedClassified:true,replan:true}));
