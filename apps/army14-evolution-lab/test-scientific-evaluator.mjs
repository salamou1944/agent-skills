import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreExperiment, verdict, experimentId, RESEARCH_BASIS } from './scientific-evaluator.mjs';

test('research basis is explicit and experiment ids are reproducible',()=>{
  assert.ok(Object.keys(RESEARCH_BASIS).length >= 4);
  assert.equal(experimentId({x:1}),experimentId({x:1}));
});

test('regressions dominate promotion decisions',()=>{
  const s=scoreExperiment({baseline:{passRate:1},candidate:{passRate:.9,regressed:2,soldiers:14}});
  assert.equal(verdict({baselineScore:1,candidateScore:s.composite,regressed:2,independent:true}),'REJECT_REGRESSION');
});

test('no independent evidence blocks promotion',()=>{
  const s=scoreExperiment({baseline:{passRate:1},candidate:{passRate:1,regressed:0,soldiers:14}});
  assert.equal(verdict({baselineScore:s.composite,candidateScore:s.composite+0.1,regressed:0,independent:false}),'BLOCK_NEEDS_INDEPENDENT_EVIDENCE');
});

test('independent net improvement becomes eligible only for the promotion gate',()=>{
  const b=scoreExperiment({baseline:{passRate:.8},candidate:{passRate:.8,regressed:0,soldiers:14}});
  const c=scoreExperiment({baseline:{passRate:.8},candidate:{passRate:1,regressed:0,soldiers:14},independent:true});
  assert.equal(verdict({baselineScore:b.composite,candidateScore:c.composite,regressed:0,independent:true}),'ELIGIBLE_FOR_PROMOTION_GATE');
});
console.log('scientific evolution evaluator: tests passed');
