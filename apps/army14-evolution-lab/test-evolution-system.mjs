import test from 'node:test'; import assert from 'node:assert/strict';
import { generateHypotheses } from './hypothesis-engine.mjs';
import { createBlindManifest, assertBlind } from './blind-evaluator.mjs';

test('hypotheses are deterministic and falsifiable',()=>{ const a=generateHypotheses({soldiers:[{id:'09',score:0}],regressions:14}); const b=generateHypotheses({soldiers:[{id:'09',score:0}],regressions:14}); assert.deepEqual(a,b); assert.ok(a.every(x=>x.falsifier)); });
test('blind manifest rejects evaluator overlap',()=>{ const m=createBlindManifest({candidateFiles:['apps/a.js'],evaluatorFiles:['apps/a.js']}); assert.equal(m.ok,false); assert.throws(()=>assertBlind(m),/BLIND_EVALUATION_VIOLATION/); });
test('blind manifest accepts disjoint evaluator',()=>{ const m=createBlindManifest({candidateFiles:['apps/a.js'],evaluatorFiles:['apps/evaluator.js']}); assert.equal(m.ok,true); assert.doesNotThrow(()=>assertBlind(m)); });
