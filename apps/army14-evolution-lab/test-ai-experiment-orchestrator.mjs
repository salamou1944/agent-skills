import test from 'node:test';
import assert from 'node:assert/strict';
import { runAIExperimentCycle, cycleId } from './ai-experiment-orchestrator.mjs';

test('cycle fails closed when AI provider is unavailable',async()=>{
  const h={id:'h1',hypothesis:'Improve verification reliability',expected:'verification coverage rises',falsifier:'independent verification fails',validation:{ok:true},plan:{target:'01-architect'}};
  const cycle=await runAIExperimentCycle({hypotheses:[h],budget:1,mutationGenerator:async()=>{throw new Error('llm_provider_not_configured')},executor:async()=>{throw new Error('must_not_execute')}});
  assert.equal(cycle.status,'NO_VERIFIED_EXPERIMENT'); assert.equal(cycle.promotion,'BLOCKED'); assert.equal(cycle.experiments[0].status,'AI_BLOCKED'); assert.equal(cycleId({a:1}),cycleId({a:1}));
});

test('verified execution cannot promote without independent repeated evidence',async()=>{
  const h={id:'h2',hypothesis:'Improve verification reliability',expected:'verification coverage rises',falsifier:'independent verification fails',validation:{ok:true},plan:{target:'01-architect'}};
  const cycle=await runAIExperimentCycle({hypotheses:[h],budget:1,mutationGenerator:async()=>({id:'mutation-1',plan:{changes:[{path:'apps/army14-evolution-lab/sample.mjs',content:'export const x=1;'}]}}),executor:async()=>({status:'VERIFIED',tests:{ok:true}})});
  assert.equal(cycle.status,'EXPERIMENTS_VERIFIED'); assert.equal(cycle.experiments[0].promotion.decision,'BLOCKED'); assert.ok(cycle.experiments[0].promotion.reasons.includes('independent_evidence_required'));
});
