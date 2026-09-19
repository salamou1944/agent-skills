import test from 'node:test'; import assert from 'node:assert/strict';
import { planExperiments } from './experiment-planner.mjs';
import { confidenceGate } from './confidence-gate.mjs';
test('planner respects budget and deterministic priority',()=>{const p=planExperiments([{id:'a',validation:{ok:true},expected:'large',falsifier:'x',plan:{target:'01'}},{id:'b',validation:{ok:true},expected:'x',falsifier:'x',plan:{target:'02'}}],1);assert.equal(p.length,1);});
test('confidence blocks a regression',()=>{assert.equal(confidenceGate({runs:[1,0.5],baseline:1}).stable,false);});
test('confidence accepts repeated non-regression',()=>{assert.equal(confidenceGate({runs:[1.1,1.2],baseline:1}).stable,true);});