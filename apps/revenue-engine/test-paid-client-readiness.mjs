import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createProductListingSales } from './product-listing-sales.mjs';
import { assertAdapter, disabledAdapter } from './adapter-contract.mjs';
import { createPaymentBillingAdapter } from './payment-billing-adapter.mjs';

test('paid-client surface is documented and uses provider-neutral boundaries',async()=>{
  const services=await readFile('SERVICES.md','utf8');
  assert.match(services,/n8n workflow automation/i);
  assert.match(services,/REST API & webhook integrations/i);
  assert.match(services,/tests and implementation documentation/i);

  const sales=createProductListingSales({mode:'dry-run'});
  const order=sales.createOrder({product_name:'Example product',product_details:'Known facts only',language:'English'},'starter');
  const handoff=sales.paymentHandoff(order);
  assert.equal(handoff.status,'payment_ready');
  assert.equal(handoff.paymentProvider,null);

  const billing=createPaymentBillingAdapter({provider:'disabled'});
  assertAdapter(billing,['createCheckout','verifyWebhook']);
  assert.equal((await billing.healthCheck()).state,'disabled');
  assert.equal(disabledAdapter('example').state,'disabled');
});
