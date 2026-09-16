import assert from 'node:assert/strict';
import { withRevenueApi } from './integration-harness.mjs';

await withRevenueApi(async (base) => {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const offer = await fetch(`${base}/product-listing/offer`);
  assert.equal(offer.status, 200);
  const offerPayload = await offer.json();
  assert.equal(offerPayload.id, 'ai-product-listing-generator');
  assert.equal(offerPayload.mode, 'dry-run');
  assert.equal(offerPayload.plans.find((plan) => plan.id === 'starter').price, 79);

  const market = await fetch(`${base}/market/services`);
  assert.equal(market.status, 200);
  const marketPayload = await market.json();
  assert.equal(marketPayload.services.length, 3);
  assert.ok(marketPayload.sources.length >= 4);

  const target = await fetch(`${base}/market/target/ecommerce-listing-optimization`);
  assert.equal(target.status, 200);
  assert.ok((await target.json()).buyerTitles.length > 0);

  const prospecting = await fetch(`${base}/market/prospecting/ecommerce-listing-optimization`);
  assert.equal(prospecting.status, 200);
  assert.ok((await prospecting.json()).length > 0);

  const qualify = await fetch(`${base}/product-listing/qualify`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ product_name: 'Demo Mug', product_details: 'Ceramic mug', language: 'English' })
  });
  assert.equal(qualify.status, 200);
  const qualification = await qualify.json();
  assert.equal(qualification.qualified, true);

  const orderResponse = await fetch(`${base}/product-listing/order`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ product: qualification.input, plan: 'starter' })
  });
  assert.equal(orderResponse.status, 200);
  const order = await orderResponse.json();
  assert.equal(order.status, 'ready_for_generation');
  assert.equal(order.price, 79);

  const generatedResponse = await fetch(`${base}/product-listing/generate`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order })
  });
  assert.equal(generatedResponse.status, 200);
  const generated = await generatedResponse.json();
  assert.equal(generated.source, 'safe-fixture');
  assert.match(generated.deliverable, /# Demo Mug/);

  const handoffResponse = await fetch(`${base}/product-listing/payment-handoff`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order })
  });
  assert.equal(handoffResponse.status, 200);
  const handoff = await handoffResponse.json();
  assert.equal(handoff.status, 'payment_ready');
  assert.equal(handoff.amount, 79);
  assert.equal(handoff.paymentProvider, null);

  const page = await fetch(`${base}/product-listing/sales-page`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Get my sample/);

  const created = await fetch(`${base}/opportunity`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Runtime test offer', source: 'test', description: 'Legitimate test opportunity.' })
  });
  assert.equal(created.status, 200);
  const opportunity = await created.json();
  assert.equal(opportunity.status, 'discovered');

  const revenueInDryRun = await fetch(`${base}/revenue/event`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirmed: true, provider: 'billing', externalEventId: 'evt_test', amount: 10, currency: 'USD' })
  });
  assert.equal(revenueInDryRun.status, 409);
  assert.equal((await revenueInDryRun.json()).error, 'live_mode_required');

  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 405);
  const malformed = await fetch(`${base}/opportunity`, { method: 'POST', body: '{' });
  assert.equal(malformed.status, 400);
});

console.log('revenue-api: runtime integration tests passed');
