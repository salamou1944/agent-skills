import test from 'node:test';
import assert from 'node:assert/strict';
import { activatePaymentHandoff, createPaymentBillingAdapter } from './payment-billing-adapter.mjs';

const order={id:'plg_fixture_123',product:'ai-product-listing-generator',plan:'starter',price:79,currency:'USD'};

test('disabled billing remains payment-ready without inventing a provider',async()=>{
  const adapter=createPaymentBillingAdapter({provider:'disabled',enabled:false});
  const result=await activatePaymentHandoff(order,adapter);
  assert.equal(result.status,'payment_ready');
  assert.equal(result.paymentProvider,null);
  assert.equal(result.paymentUrl,null);
});

test('fixture billing creates a deterministic checkout boundary',async()=>{
  const adapter=createPaymentBillingAdapter({provider:'fixture',enabled:true});
  assert.deepEqual(await adapter.healthCheck(),{ok:true,state:'ready',provider:'fixture'});
  const result=await activatePaymentHandoff(order,adapter);
  assert.equal(result.status,'payment_pending');
  assert.equal(result.paymentProvider,'fixture');
  assert.match(result.paymentUrl,/example\.invalid\/checkout\/plg_fixture_123/);
  assert.equal(result.amount,79);
  assert.equal(result.currency,'USD');
});

test('zero-price orders never require a payment provider',async()=>{
  const result=await activatePaymentHandoff({...order,id:'sample',price:0},createPaymentBillingAdapter({provider:'disabled'}));
  assert.equal(result.status,'no_payment_required');
  assert.equal(result.paymentUrl,null);
});

test('enabled non-fixture providers fail closed until a live adapter exists',async()=>{
  const adapter=createPaymentBillingAdapter({provider:'live-provider',enabled:true});
  assert.equal((await adapter.healthCheck()).state,'failed');
  const result=await activatePaymentHandoff(order,adapter);
  assert.equal(result.status,'payment_ready');
  assert.equal(result.paymentUrl,null);
  assert.equal(result.paymentProvider,null);
});
