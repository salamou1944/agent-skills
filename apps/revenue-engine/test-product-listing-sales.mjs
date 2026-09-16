import assert from 'node:assert/strict';
import { createProductListingSales } from './product-listing-sales.mjs';

const calls = [];
const fakeFetch = async (url, options) => {
  calls.push({ url, options });
  return new Response(JSON.stringify({
    ok: true,
    result: {
      title: 'Verified Lamp',
      short_description: 'A compact lamp.',
      description: 'A lamp described only from supplied facts.',
      selling_points: ['Compact'],
      ad_copy: 'Light your space.',
      cta: 'Shop now',
      audience: 'Home shoppers',
      cautions: []
    }
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const sales = createProductListingSales({ apiBaseUrl: 'https://api.example.test', apiKey: 'test-key', fetchImpl: fakeFetch, mode: 'live' });
assert.equal(sales.offer().id, 'ai-product-listing-generator');
assert.equal(sales.offer().plans.find((p) => p.id === 'starter').price, 79);

const qualification = sales.qualify({ product_name: 'Verified Lamp', product_details: 'Compact desk lamp', language: 'English' });
assert.equal(qualification.qualified, true);

const order = sales.createOrder(qualification.input, 'starter');
assert.equal(order.status, 'ready_for_generation');
assert.equal(order.price, 79);

const generated = await sales.generate(order);
assert.equal(generated.source, 'sal-31-api');
assert.equal(generated.result.title, 'Verified Lamp');
assert.match(generated.deliverable, /# Verified Lamp/);
assert.equal(calls.length, 1);
assert.equal(calls[0].options.headers['x-api-key'], 'test-key');
assert.equal(JSON.parse(calls[0].options.body).product_name, 'Verified Lamp');

const handoff = sales.paymentHandoff(order);
assert.equal(handoff.status, 'payment_ready');
assert.equal(handoff.amount, 79);
assert.equal(handoff.paymentProvider, null);

const fixture = createProductListingSales({ apiBaseUrl: 'https://api.example.test', apiKey: 'test-key', mode: 'dry-run', fetchImpl: fakeFetch });
const fixtureOrder = fixture.createOrder({ product_name: 'Demo Mug' });
const fixtureResult = await fixture.generate(fixtureOrder);
assert.equal(fixtureResult.source, 'safe-fixture');
assert.equal(fixtureResult.ok, true);
assert.equal(calls.length, 1, 'dry-run must not call the upstream API');

assert.throws(() => sales.qualify({}), /product_input_required/);
assert.throws(() => sales.createOrder({ product_name: 'x' }, 'unknown'), /unknown_plan/);
assert.throws(() => sales.qualify({ product_name: 'x', image_url: 'ftp://bad.test/x.jpg' }), /invalid_image_url/);

console.log('product-listing-sales: tests passed');
