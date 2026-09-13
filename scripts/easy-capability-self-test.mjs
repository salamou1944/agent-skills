import assert from 'node:assert/strict';
import { auditEasyCapabilities } from '../tools/easy-capability-audit.mjs';

const empty = auditEasyCapabilities();
assert.equal(empty.schemaVersion, 1);
assert.equal(empty.complete, false);
assert.equal(empty.firstGap, 'product-understanding');

const partial = auditEasyCapabilities({
  declared: ['product-understanding', 'product-integrity'],
  implemented: ['product-understanding'],
  validated: []
});
assert.equal(partial.rows[0].status, 'implemented-unvalidated');
assert.equal(partial.rows[1].status, 'declared-only');
assert.equal(partial.firstGap, 'product-understanding');

const complete = auditEasyCapabilities({
  declared: ['product-understanding','product-integrity','creative-planning','creative-validation','seller-experience','commerce-data','api-contracts','integration-boundary','observability','security'],
  implemented: ['product-understanding','product-integrity','creative-planning','creative-validation','seller-experience','commerce-data','api-contracts','integration-boundary','observability','security'],
  validated: ['product-understanding','product-integrity','creative-planning','creative-validation','seller-experience','commerce-data','api-contracts','integration-boundary','observability','security']
});
assert.equal(complete.complete, true);
assert.equal(complete.firstGap, null);

console.log('EASY capability audit self-test: PASS');
