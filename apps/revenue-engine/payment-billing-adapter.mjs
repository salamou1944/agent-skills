import crypto from 'node:crypto';

export const BILLING_STATES = Object.freeze(['disabled', 'ready', 'failed']);

function clean(value, max = 200) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('billing_value_must_be_string');
  const result = value.trim();
  if (result.length > max) throw new Error('billing_value_too_long');
  return result;
}

function assertOrder(order) {
  if (!order?.id || !order?.product || !order?.plan) throw new Error('valid_order_required');
  if (!Number.isFinite(order.price) || order.price < 0) throw new Error('valid_order_price_required');
  if (!order.currency) throw new Error('order_currency_required');
  return order;
}

function fixtureCheckout(order) {
  const fingerprint = crypto.createHash('sha256').update(`${order.id}:${order.price}:${order.currency}`).digest('hex').slice(0, 24);
  return `https://example.invalid/checkout/${encodeURIComponent(order.id)}?ref=${fingerprint}`;
}

export function createPaymentBillingAdapter({ provider = process.env.PAYMENT_PROVIDER || 'disabled', enabled = process.env.PAYMENT_PROVIDER_ENABLED === 'true' } = {}) {
  const name = clean(provider.toLowerCase());

  if (name === 'fixture') {
    return Object.freeze({
      name: 'fixture',
      state: 'ready',
      async healthCheck() { return { ok: true, state: 'ready', provider: 'fixture' }; },
      async createCheckout(order) {
        assertOrder(order);
        if (order.price === 0) return { ok: true, status: 'no_payment_required', paymentProvider: 'fixture', paymentUrl: null, orderId: order.id };
        return { ok: true, status: 'payment_pending', paymentProvider: 'fixture', paymentUrl: fixtureCheckout(order), orderId: order.id, amount: order.price, currency: order.currency };
      },
      async verifyWebhook(payload = {}) {
        return { ok: true, status: 'verified_fixture', eventId: clean(payload.eventId || `fixture_${crypto.randomUUID()}`) };
      }
    });
  }

  if (enabled) {
    return Object.freeze({
      name: name || 'configured',
      state: 'failed',
      async healthCheck() { return { ok: false, state: 'failed', reason: 'live_provider_adapter_not_implemented' }; },
      async createCheckout() { throw new Error('live_payment_provider_adapter_not_implemented'); },
      async verifyWebhook() { throw new Error('live_payment_provider_adapter_not_implemented'); }
    });
  }

  return Object.freeze({
    name: name || 'disabled',
    state: 'disabled',
    async healthCheck() { return { ok: false, state: 'disabled', reason: 'payment_provider_not_configured' }; },
    async createCheckout() { throw new Error('payment_provider_disabled'); },
    async verifyWebhook() { throw new Error('payment_provider_disabled'); }
  });
}

export async function activatePaymentHandoff(order, adapter = createPaymentBillingAdapter()) {
  assertOrder(order);
  if (!adapter || typeof adapter.createCheckout !== 'function' || typeof adapter.healthCheck !== 'function') throw new Error('billing_adapter_required');
  if (order.price === 0) return { ok: true, status: 'no_payment_required', orderId: order.id, paymentProvider: null, paymentUrl: null, amount: 0, currency: order.currency };
  const health = await adapter.healthCheck();
  if (!health.ok) {
    return { ok: true, status: 'payment_ready', orderId: order.id, paymentProvider: null, paymentUrl: null, amount: order.price, currency: order.currency, reason: health.reason || 'provider_unavailable' };
  }
  return adapter.createCheckout(order);
}
