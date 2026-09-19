import test from 'node:test'; import assert from 'node:assert/strict';
import { promotionGateV2 } from './promotion-gate-v2.mjs';
import { trajectoryEvent, learnFromFailures } from './trajectory-memory.mjs';
test('promotion requires all independent controls',()=>{ const x=promotionGateV2({baselineScore:1,candidateScore:2,regressed:0,independent:true,repeats:2,securityFindings:0,harnessStable:true,evidenceArtifact:true}); assert.equal(x.eligible,true); });
test('promotion blocks regression even with score gain',()=>{ const x=promotionGateV2({baselineScore:1,candidateScore:2,regressed:1,independent:true,repeats:3,securityFindings:0,harnessStable:true,evidenceArtifact:true}); assert.equal(x.eligible,false); });
test('repeated failure becomes hard constraint',()=>{ const e=trajectoryEvent({experimentId:'x',phase:'candidate',outcome:'fail',failureSignature:'429',lesson:'provider exhausted'}); const learned=learnFromFailures([e,e]); assert.equal(learned[0].action,'convert_to_hard_constraint'); });
