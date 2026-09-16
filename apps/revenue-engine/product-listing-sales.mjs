import crypto from 'node:crypto';

export const PRODUCT_LISTING_OFFER = Object.freeze({
  id: 'ai-product-listing-generator',
  name: 'AI Product Listing Generator',
  currency: 'USD',
  plans: [
    { id: 'sample', products: 1, price: 0, label: 'Free sample' },
    { id: 'starter', products: 20, price: 79, label: '20 products' },
    { id: 'scale', products: 100, price: 249, label: '100 products' }
  ],
  deliverables: ['title', 'short_description', 'description', 'selling_points', 'ad_copy', 'cta', 'audience', 'cautions'],
  qualification: ['product_name', 'product_details', 'language']
});

const MAX_NAME = 200;
const MAX_DETAILS = 8_000;
const MAX_LANGUAGE = 60;

function cleanString(value, field, max) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error(`${field}_must_be_string`);
  const result = value.trim();
  if (result.length > max) throw new Error(`${field}_too_long`);
  return result;
}

function validateInput(input = {}) {
  const product_name = cleanString(input.product_name, 'product_name', MAX_NAME);
  const product_details = cleanString(input.product_details, 'product_details', MAX_DETAILS);
  const language = cleanString(input.language || 'English', 'language', MAX_LANGUAGE) || 'English';
  const image_url = cleanString(input.image_url, 'image_url', 2_000) || null;
  if (!product_name && !product_details && !image_url) throw new Error('product_input_required');
  if (image_url) {
    try {
      const url = new URL(image_url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid');
    } catch {
      throw new Error('invalid_image_url');
    }
  }
  return { product_name, product_details, language, image_url };
}

function orderId() {
  return `plg_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}

function fixtureContent(input) {
  const name = input.product_name || 'Product';
  return {
    title: name,
    short_description: `A clear, sales-ready listing for ${name}.`,
    description: input.product_details || `Product listing draft for ${name}; verify missing specifications before publishing.`,
    selling_points: ['Clear product positioning', 'Readable online-store copy', 'Facts kept within supplied information'],
    ad_copy: `Discover ${name}. See the details and decide if it fits your needs.`,
    cta: 'Learn more',
    audience: 'Online shoppers interested in the supplied product details',
    cautions: ['Fixture output only; verify product facts before publishing.']
  };
}

function markdownDeliverable(order, content) {
  const bullets = (items) => (Array.isArray(items) ? items : []).map((item) => `- ${item}`).join('\n');
  return [
    `# ${content.title}`,
    '',
    `**Order:** ${order.id}`,
    `**Language:** ${order.input.language}`,
    '',
    '## Short description',
    content.short_description,
    '',
    '## Description',
    content.description,
    '',
    '## Selling points',
    bullets(content.selling_points),
    '',
    '## Ad copy',
    content.ad_copy,
    '',
    '## CTA',
    content.cta,
    '',
    '## Audience',
    content.audience,
    '',
    '## Cautions',
    bullets(content.cautions)
  ].join('\n');
}

export function createProductListingSales({
  apiBaseUrl = process.env.PRODUCT_CONTENT_API_URL || '',
  apiKey = process.env.PRODUCT_CONTENT_API_KEY || '',
  fetchImpl = globalThis.fetch,
  mode = 'dry-run'
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch_unavailable');
  if (!['dry-run', 'live'].includes(mode)) throw new Error('invalid_sales_mode');

  function offer() {
    return { ...PRODUCT_LISTING_OFFER, mode, upstreamConfigured: Boolean(apiBaseUrl && apiKey) };
  }

  function qualify(input) {
    const normalized = validateInput(input);
    return {
      ok: true,
      qualified: true,
      status: 'qualified',
      input: normalized,
      next: 'generate'
    };
  }

  function createOrder(input, plan = 'sample') {
    const normalized = validateInput(input);
    const selected = PRODUCT_LISTING_OFFER.plans.find((item) => item.id === plan);
    if (!selected) throw new Error('unknown_plan');
    return {
      id: orderId(),
      product: PRODUCT_LISTING_OFFER.id,
      plan: selected.id,
      price: selected.price,
      currency: PRODUCT_LISTING_OFFER.currency,
      status: 'ready_for_generation',
      input: normalized,
      createdAt: new Date().toISOString()
    };
  }

  async function generate(order) {
    if (!order?.id || !order.input) throw new Error('valid_order_required');
    if (mode !== 'live') {
      const result = fixtureContent(order.input);
      return { ok: true, source: 'safe-fixture', status: 'generated', order, result, deliverable: markdownDeliverable(order, result) };
    }
    if (!apiBaseUrl || !apiKey) throw new Error('product_content_api_not_configured');
    const response = await fetchImpl(`${apiBaseUrl.replace(/\/$/, '')}/v1/product-content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(order.input)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`product_content_api_${response.status}`);
    if (!payload?.ok || !payload?.result) throw new Error('invalid_product_content_response');
    return { ok: true, source: 'sal-31-api', status: 'generated', order, result: payload.result, deliverable: markdownDeliverable(order, payload.result) };
  }

  function paymentHandoff(order) {
    if (!order?.id || !Number.isFinite(order.price)) throw new Error('valid_order_required');
    return {
      ok: true,
      status: 'payment_ready',
      orderId: order.id,
      product: order.product,
      plan: order.plan,
      amount: order.price,
      currency: order.currency,
      paymentProvider: null,
      paymentUrl: null,
      note: order.price === 0 ? 'No payment required for the sample.' : 'Payment provider not activated; handoff is ready for a configured billing adapter.'
    };
  }

  return { offer, qualify, createOrder, generate, paymentHandoff };
}
