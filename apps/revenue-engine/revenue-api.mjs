import { createServer } from 'node:http';
import { createEngine } from './revenue-engine.mjs';
import { createProductListingSales } from './product-listing-sales.mjs';
import { createSalesPipeline } from './sales-pipeline.mjs';
import { renderProductListingSalesPage } from './product-listing-sales-page.mjs';
import { SERVICE_OFFERS, SERVICE_MARKET_SOURCES, rankServices, buildTargetProfile, buildProspectingQueries } from './service-market-intelligence.mjs';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(payload);
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('request_too_large');
  }
  return raw ? JSON.parse(raw) : {};
}

export function createRevenueApi({ engine = createEngine({ mode: 'dry-run' }), productListingSales = createProductListingSales(), salesPipeline = createSalesPipeline() } = {}) {
  return async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, mode: engine.mode });
      if (req.method === 'GET' && req.url === '/product-listing/offer') return json(res, 200, productListingSales.offer());
      if (req.method === 'GET' && req.url === '/product-listing/sales-page') {
        const html = renderProductListingSalesPage();
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(html);
      }
      if (req.method === 'GET' && req.url === '/market/services') return json(res, 200, { sources: SERVICE_MARKET_SOURCES, services: rankServices() });
      if (req.method === 'GET' && req.url.startsWith('/market/target/')) return json(res, 200, buildTargetProfile(decodeURIComponent(req.url.slice('/market/target/'.length))));
      if (req.method === 'GET' && req.url.startsWith('/market/prospecting/')) return json(res, 200, buildProspectingQueries(decodeURIComponent(req.url.slice('/market/prospecting/'.length))));
      if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
      const input = await body(req);
      if (req.url === '/opportunity') return json(res, 200, engine.discover(input));
      if (req.url === '/opportunity/verify') return json(res, 200, engine.verify(input.opportunity, input.evidence));
      if (req.url === '/opportunity/score') return json(res, 200, engine.score(input.opportunity, input.metrics));
      if (req.url === '/plan') return json(res, 200, engine.plan(input.opportunity));
      if (req.url === '/fanout') return json(res, 200, engine.fanOut(input.opportunity, input.plan));
      if (req.url === '/product-listing/qualify') return json(res, 200, productListingSales.qualify(input));
      if (req.url === '/product-listing/order') return json(res, 200, productListingSales.createOrder(input.product, input.plan));
      if (req.url === '/product-listing/generate') return json(res, 200, await productListingSales.generate(input.order));
      if (req.url === '/product-listing/payment-handoff') return json(res, 200, productListingSales.paymentHandoff(input.order));
      if (req.url === '/sales-pipeline/create') return json(res, 201, salesPipeline.create(input));
      if (req.url === '/sales-pipeline/advance') return json(res, 200, salesPipeline.advance(input.id, input.stage, input.evidence));
      if (req.url === '/sales-pipeline/list') return json(res, 200, salesPipeline.list(input.stage));
      return json(res, 404, { error: 'not_found' });
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  };
}

const server = createServer(createRevenueApi());
const port = Number(process.env.REVENUE_ENGINE_PORT || 8787);
if (import.meta.url === `file://${process.argv[1]}`) server.listen(port, '127.0.0.1', () => console.log(`revenue-engine-api listening on 127.0.0.1:${port}`));
export { server };
