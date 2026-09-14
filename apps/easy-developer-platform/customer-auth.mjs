import http from 'node:http';

const port = Number(process.env.EASY_CUSTOMER_PORT || 8795);
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '');

const send = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(data));
};

function configured() {
  return Boolean(supabaseUrl && publishableKey);
}

function publicCustomer(user) {
  const metadata = user?.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    name: String(metadata.name || metadata.full_name || '').trim(),
    role: String(metadata.role || 'customer'),
    createdAt: user.created_at,
  };
}

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

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function supabase(path, options = {}) {
  if (!configured()) throw Object.assign(new Error('supabase_not_configured'), { status: 503 });
  const headers = {
    apikey: publishableKey,
    'content-type': 'application/json',
    ...(options.headers || {}),
  };
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  return { response, data };
}

async function currentUser(accessToken) {
  if (!accessToken) return null;
  const { response, data } = await supabase('/auth/v1/user', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return response.ok && data?.id ? data : null;
}

async function register(email, name, password) {
  const { response, data } = await supabase('/auth/v1/signup', {
    method: 'POST',
    headers: { authorization: `Bearer ${publishableKey}` },
    body: JSON.stringify({ email, password, data: { name, role: 'customer' } }),
  });
  if (!response.ok) {
    const message = String(data?.msg || data?.message || data?.error_description || data?.error || 'registration_failed');
    const status = response.status === 422 ? 409 : response.status;
    return { status, error: message };
  }
  if (!data?.user || !data?.access_token) return { status: 409, error: 'email_confirmation_required' };
  return { status: 201, user: data.user, accessToken: data.access_token, refreshToken: data.refresh_token };
}

async function login(email, password) {
  const { response, data } = await supabase('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { authorization: `Bearer ${publishableKey}` },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok || !data?.user || !data?.access_token) return { status: 401, error: 'invalid_credentials' };
  return { status: 200, user: data.user, accessToken: data.access_token, refreshToken: data.refresh_token };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/customer/health') {
      return send(res, configured() ? 200 : 503, {
        ok: configured(),
        service: 'easy-customer-auth',
        backend: 'supabase-auth',
        persistent: true,
        registration: configured(),
        login: configured(),
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/customer/me') {
      const user = await currentUser(bearer(req));
      return user ? send(res, 200, { authenticated: true, customer: publicCustomer(user) }) : send(res, 401, { authenticated: false, error: 'unauthorized' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/register') {
      const x = await body(req);
      const email = normalizeEmail(x.email);
      const name = String(x.name || '').trim();
      const password = String(x.password || '');
      if (!validEmail(email)) return send(res, 400, { error: 'valid_email_required' });
      if (name.length < 2 || name.length > 120) return send(res, 400, { error: 'name_required' });
      if (password.length < 8 || password.length > 200) return send(res, 400, { error: 'password_minimum_8_characters' });
      const result = await register(email, name, password);
      if (result.status !== 201) return send(res, result.status, { error: result.error });
      return send(res, 201, { customer: publicCustomer(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken, tokenType: 'Bearer' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/login') {
      const x = await body(req);
      const email = normalizeEmail(x.email);
      const password = String(x.password || '');
      if (!validEmail(email)) return send(res, 401, { error: 'invalid_credentials' });
      const result = await login(email, password);
      if (result.status !== 200) return send(res, 401, { error: result.error });
      return send(res, 200, { customer: publicCustomer(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken, tokenType: 'Bearer' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/logout') {
      const accessToken = bearer(req);
      if (accessToken) await supabase('/auth/v1/logout', { method: 'POST', headers: { authorization: `Bearer ${accessToken}` } });
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/customer/dashboard') {
      const user = await currentUser(bearer(req));
      if (!user) return send(res, 401, { error: 'unauthorized' });
      return send(res, 200, { customer: publicCustomer(user), next: ['browse products', 'view sellers and ratings', 'create an order when ordering is enabled'] });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    return send(res, Number(error.status) || 500, { error: error.message || 'internal_error' });
  }
}).listen(port, '127.0.0.1', () => console.log(JSON.stringify({ service: 'easy-customer-auth', port, backend: 'supabase-auth', persistent: configured() })));