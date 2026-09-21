import assert from 'node:assert/strict';
import { evaluateHumanTrialReadiness } from './human-trial-readiness.mjs';

const common = {
  gateway:{status:200,body:{platformOnline:true,operatorOnline:true}},
  integration:{status:200,body:'EASY Developer Platform'},
  creativeHealth:{status:200,body:{status:'READY'}},
  creativeProvider:{status:200,body:{status:'READY',generationEnabled:true}},
  creativeSelfTest:{status:200,body:{status:'PASS'}},
  customerHealth:{status:200,body:{persistent:true}},
  revenueHealth:{status:200,body:{ok:true}},
  runtimeIdentity:{runtimeCommit:'a'.repeat(40),deploymentId:'dep-1'},
  humanTrialAuthorized:true
};

assert.equal(evaluateHumanTrialReadiness(common).decision,'HUMAN_READY');

assert.equal(
  evaluateHumanTrialReadiness({
    ...common,
    creativeSelfTest:{status:503,body:{reason:'provider_http_429'},reason:'provider_http_429'}
  }).decision,
  'BLOCKED_EXTERNAL_DEPENDENCY'
);

assert.equal(
  evaluateHumanTrialReadiness({...common, runtimeIdentity:null}).decision,
  'VERIFICATION_FAILED'
);

assert.equal(
  evaluateHumanTrialReadiness({...common, humanTrialAuthorized:false}).decision,
  'VERIFICATION_FAILED'
);

assert.equal(
  evaluateHumanTrialReadiness({
    ...common,
    creativeProvider:{status:200,body:{status:'READY',generationEnabled:false}}
  }).decision,
  'VERIFICATION_FAILED'
);

console.log('human-trial-evidence-gate: passed');
