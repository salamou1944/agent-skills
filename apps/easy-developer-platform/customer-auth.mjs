import http from 'node:http';

const port = Number(process.env.EASY_CUSTOMER_PORT || 8795);
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const authService = String(process.env.EASY_CUSTOMER_AUTH_URL || `${supabaseUrl}/functions/v1/easy-customer-auth`).replace(/\/$/, '');

const send = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(data));
};

function bearer(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw Object.assign(new Error('body_too_large'), { status: 413 });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
}

async function auth(path, options = {}) {
  if (!authService || authService === '/functions/v1/easy-customer-auth') throw Object.assign(new Error('supabase_auth_not_configured'), { status: 503 });
  const response = await fetch(`${authService}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  return { response, data };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/customer/health') {
      const result = await auth('/health');
      return send(res, result.response.ok ? 200 : 503, { ok: result.response.ok, service: 'easy-customer-auth', backend: 'supabase-auth', persistent: true, registration: result.response.ok, login: result.response.ok });
    }
    if (req.method === 'GET' && url.pathname === '/api/customer/me') {
      const result = await auth('/me', { headers: { authorization: `Bearer ${bearer(req)}` } });
      return send(res, result.response.status, result.data || { error: 'unauthorized' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/register') {
      const result = await auth('/register', { method: 'POST', body: JSON.stringify(await body(req)) });
      return send(res, result.response.status, result.data || { error: 'registration_failed' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/login') {
      const result = await auth('/login', { method: 'POST', body: JSON.stringify(await body(req)) });
      return send(res, result.response.status, result.data || { error: 'invalid_credentials' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/logout') {
      const result = await auth('/logout', { method: 'POST', headers: { authorization: `Bearer ${bearer(req)}` } });
      return send(res, result.response.status, result.data || { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/customer/dashboard') {
      const result = await auth('/dashboard', { headers: { authorization: `Bearer ${bearer(req)}` } });
      return send(res, result.response.status, result.data || { error: 'unauthorized' });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    return send(res, Number(error.status) || 500, { error: error.message || 'internal_error' });
  }
}).listen(port, '127.0.0.1', () => console.log(JSON.stringify({ service: 'easy-customer-auth', port, backend: 'supabase-auth', persistent: true })));