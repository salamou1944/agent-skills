import assert from 'node:assert/strict';
import { createSalesPipeline, SALES_STAGES } from './sales-pipeline.mjs';
import { renderProductListingSalesPage } from './product-listing-sales-page.mjs';

const pipeline = createSalesPipeline();
const sale = pipeline.create({ buyer: 'fixture@example.invalid', plan: 'starter' });
assert.equal(sale.stage, 'found');
assert.deepEqual(SALES_STAGES, ['found', 'submitted', 'replied', 'call', 'accepted', 'paid', 'delivery', 'recurring']);

for (const stage of SALES_STAGES.slice(1)) pipeline.advance(sale.id, stage, { verified: true });
assert.equal(pipeline.get(sale.id).stage, 'recurring');
assert.throws(() => pipeline.advance(sale.id, 'paid'), /sales_stage_regression/);
assert.throws(() => pipeline.create({ stage: 'bogus' }), /invalid_sales_stage/);

const page = renderProductListingSalesPage();
assert.match(page, /AI Product Listing Generator/);
assert.match(page, /Get my sample/);
assert.match(page, /\$79/);
assert.match(page, /\$249/);

console.log('sales pipeline and sales page checks passed');
