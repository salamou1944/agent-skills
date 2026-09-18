import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateRetrieval, shouldAbstain } from './retrieval-evaluator.mjs';

test('retrieval evaluator measures missing context and distractors', () => {
  const result = evaluateRetrieval({ relevant: ['a.mjs', 'b.mjs', 'c.test.mjs'], retrieved: ['a.mjs', 'noise.mjs', 'c.test.mjs'], budget: 3 });
  assert.equal(result.truePositives, 2);
  assert.equal(result.falsePositives, 1);
  assert.equal(result.falseNegatives, 1);
  assert.equal(result.recall, 2 / 3);
  assert.equal(result.precision, 2 / 3);
});

test('retrieval budget is applied before metrics', () => {
  const result = evaluateRetrieval({ relevant: ['a', 'b'], retrieved: ['noise', 'a', 'b'], budget: 2 });
  assert.equal(result.recall, 0.5);
  assert.equal(result.withinBudget, true);
});

test('low retrieval quality causes abstention', () => {
  assert.equal(shouldAbstain({ recall: 0.6, precision: 0.9 }), true);
  assert.equal(shouldAbstain({ recall: 0.9, precision: 0.8 }), false);
});
