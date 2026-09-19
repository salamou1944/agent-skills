import test from 'node:test';
import assert from 'node:assert/strict';
import {
  phenotype,
  crossover,
  mutate,
  evolveGeneration,
  discoverEmergentCapability,
  phenotypeHash,
} from './digital-evolution.mjs';

const base = {
  traits: ['contract', 'verification', 'recovery'],
};

const evaluator = (p) => ({
  score: p.behaviors.includes('compose-capabilities-across-agents') ? 1 : 0.5,
  accepted: p.behaviors.includes('attack-before-promotion'),
});

test('mutation preserves required biological invariants', () => {
  const child = mutate(base, { operation: 'add', trait: 'cross-soldier' });
  assert.ok(child.traits.includes('cross-soldier'));
  assert.deepEqual(child.traits.filter((x) => ['contract','verification','recovery'].includes(x)).sort(), ['contract','recovery','verification']);
});

test('crossover creates a heritable descendant instead of editing parents', () => {
  const a = { traits: [...base.traits, 'counterfactual'] };
  const b = { traits: [...base.traits, 'cross-soldier', 'heldout'] };
  const child = crossover(a, b);
  assert.notEqual(child, a);
  assert.notEqual(child, b);
  assert.ok(child.traits.includes('contract'));
});

test('selection is delegated to an independent evaluator', () => {
  const result = evolveGeneration([
    base,
    { traits: [...base.traits, 'cross-soldier'] },
    { traits: [...base.traits, 'adversarial'] },
  ], evaluator, { generation: 0 });
  assert.equal(result.generation, 1);
  assert.ok(result.candidates.length > 0);
  assert.ok(result.survivors.length > 0);
});

test('emergence is relative to a frozen baseline, not a marketing claim', () => {
  const candidate = mutate(base, { operation: 'add', trait: 'cross-soldier' });
  const result = discoverEmergentCapability({
    baselinePhenotypeHashes: [phenotypeHash(base)],
    candidate,
  });
  assert.equal(result.novelRelativeToBaseline, true);
  assert.equal(result.emergentCapability, true);
  assert.ok(result.evidenceRequired.includes('independent_heldout_evaluation'));
});

test('invalid mutation cannot delete required traits', () => {
  assert.throws(() => mutate(base, { operation: 'remove', trait: 'verification' }), /genome_lost_required_trait/);
});
