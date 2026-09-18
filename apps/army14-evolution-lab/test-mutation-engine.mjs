import assert from 'node:assert/strict';
import test from 'node:test';
import { mutationId, validateMutationPlan } from './mutation-engine.mjs';

test('mutation ids are deterministic', () => {
  assert.equal(mutationId({a:1}), mutationId({a:1}));
  assert.notEqual(mutationId({a:1}), mutationId({a:2}));
});

test('mutation plans reject workflow and sensitive paths', () => {
  const base = { hypothesis:'Improve verification resilience for the target soldier.', changes:[{path:'README.md',content:'ok'}] };
  assert.equal(validateMutationPlan(base), true);
  assert.throws(() => validateMutationPlan({...base,changes:[{path:'.github/workflows/x.yml',content:'bad'}]}), /workflow_forbidden/);
  assert.throws(() => validateMutationPlan({...base,changes:[{path:'.env',content:'bad'}]}), /unsafe_path/);
});

test('mutation plans require a bounded change set and hypothesis', () => {
  assert.throws(() => validateMutationPlan({hypothesis:'short',changes:[{path:'README.md',content:'x'}]}), /hypothesis_required/);
  assert.throws(() => validateMutationPlan({hypothesis:'A sufficiently specific mutation hypothesis.',changes:[]}), /changes_invalid/);
});
console.log('army14-evolution-lab: mutation engine tests passed');
