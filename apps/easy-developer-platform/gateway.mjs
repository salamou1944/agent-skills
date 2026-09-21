import http from 'node:http';

const port = Number(process.env.GATEWAY_PORT || 8080);
const platform = String(process.env.EASY_PLATFORM_URL || 'http://127.0.0.1:8790').replace(/\/$/, '');
const operator = String(process.env.EASY_OPERATOR_URL || 'http://127.0.0.1:8792').replace(/\/$/, '');
const creative = String(process.env.EASY_CREATIVE_URL || 'http://127.0.0.1:8793').replace(/\/$/, '');
const creativeJob = String(process.env.EASY_CREATIVE_JOB_URL || 'http://127.0.0.1:8794').replace(/\/$/, '');
const customer = String(process.env.EASY_CUSTOMER_URL || 'http://127.0.0.1:8795').replace(/\/$/, '');
const revenue = String(process.env.MONY_REVENUE_URL || 'http://127.0.0.1:8796').replace(/\/$/, '');

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
};

async function health(base, path) {
  try {
    const response = await fetch(`${base}${path}`);
    return response.ok;
  } catch {
    return false;
  }
}

async function proxy(req, res, base, path) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2_000_000) return send(res, 413, { error: 'body_too_large' });
  }
  const headers = {};
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  try {
    const response = await fetch(`${base}${path}`, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw
    });
    const text = await response.text();
    res.writeHead(response.status, {
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });
    res.end(text);
  } catch {
    send(res, 502, { error: 'upstream_unavailable' });
  }
}

const home = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EASY</title><style>body{font-family:system-ui;background:#050b14;color:#eaf2ff;max-width:900px;margin:0 auto;padding:32px}a{display:inline-block;margin:8px;padding:12px 16px;border-radius:10px;background:#68d5ff;color:#06111a;text-decoration:none;font-weight:700}.card{padding:24px;border:1px solid #28415b;border-radius:18px;background:#0a1422;margin-bottom:16px}.muted{color:#9eb3c7}.ok{color:#84f7b1}.bad{color:#ff9f9f}code{font-family:ui-monospace,monospace}</style></head><body><div class="card"><h1>EASY</h1><p class="muted">Live gateway for the deployed EASY platform.</p><a href="/customer">Customer</a><a href="/integration">Platform</a><a href="/creative">Creative</a><a href="/operator">Operator</a></div><div class="card"><h2>Runtime status</h2><pre id="status">Loading…</pre></div><script>fetch('/api/gateway/status').then(async r=>{const d=await r.json();document.getElementById('status').textContent=JSON.stringify(d,null,2);document.getElementById('status').className=r.ok?'ok':'bad'}).catch(e=>{document.getElementById('status').textContent=String(e);document.getElementById('status').className='bad'});</script></body></html>`;

const serviceStatus = async () => ({
  service: 'easy-platform-gateway',
  platformOnline: await health(platform, '/api/health'),
  operatorOnline: await health(operator, '/api/operator/health'),
  creativeOnline: await health(creative, '/api/creative/health'),
  creativeJobOnline: await health(creativeJob, '/api/creative-job/health'),
  customerOnline: await health(customer, '/api/customer/health'),
  revenueOnline: await health(revenue, '/api/revenue/health')
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/gateway/status') {
    const body = await serviceStatus();
    const healthy = Object.entries(body).filter(([key]) => key.endsWith('Online')).every(([, value]) => value === true);
    return send(res, healthy ? 200 : 503, { ...body, healthy });
  }
  if (req.method === 'GET' && url.pathname === '/') return send(res, 200, home, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/customer') return send(res, 200, home, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/creative') return send(res, 200, home, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/operator') return send(res, 200, home, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/integration') return proxy(req, res, platform, '/');
  if (url.pathname.startsWith('/api/revenue/')) return proxy(req, res, revenue, url.pathname + url.search);
  if (url.pathname.startsWith('/api/customer/')) return proxy(req, res, customer, url.pathname + url.search);
  if (url.pathname.startsWith('/api/creative-job/')) return proxy(req, res, creativeJob, url.pathname + url.search);
  if (url.pathname.startsWith('/api/creative/')) return proxy(req, res, creative, url.pathname + url.search);
  if (url.pathname.startsWith('/api/operator/')) return proxy(req, res, operator, url.pathname + url.search);
  if (url.pathname.startsWith('/api/')) return proxy(req, res, platform, url.pathname + url.search);
  return send(res, 404, { error: 'not_found' });
});

server.listen(port, () => console.log(`EASY gateway listening on ${port}`));
