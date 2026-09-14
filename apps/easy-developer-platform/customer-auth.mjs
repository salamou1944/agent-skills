import http from 'node:http';
import crypto from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.EASY_CUSTOMER_PORT || 8795);
const stateFile = resolve(process.env.EASY_CUSTOMER_STATE_FILE || resolve(root, 'data/customers.json'));
const sessions = new Map();
let state = { version: 1, customers: [] };

const send = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(data));
};

async function persist() {
  await mkdir(dirname(stateFile), { recursive: true });
  const tmp = `${stateFile}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await rename(tmp, stateFile);
}

async function load() {
  try {
    state = JSON.parse(await readFile(stateFile, 'utf8'));
    if (!Array.isArray(state.customers)) state = { version: 1, customers: [] };
  } catch {
    state = { version: 1, customers: [] };
  }
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

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, record) {
  const actual = crypto.scryptSync(password, record.salt, 32);
  const expected = Buffer.from(record.passwordHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicCustomer(customer) {
  return { id: customer.id, email: customer.email, name: customer.name, role: customer.role, createdAt: customer.createdAt };
}

function sessionCustomer(req) {
  const raw = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!raw) return null;
  const id = sessions.get(raw);
  if (!id) return null;
  return state.customers.find(c => c.id === id) || null;
}

function token() { return crypto.randomBytes(32).toString('base64url'); }

await load();

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/customer/health') return send(res, 200, { ok: true, service: 'easy-customer-auth', registration: true, login: true });
    if (req.method === 'GET' && url.pathname === '/api/customer/me') {
      const customer = sessionCustomer(req);
      return customer ? send(res, 200, { authenticated: true, customer: publicCustomer(customer) }) : send(res, 401, { authenticated: false, error: 'unauthorized' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/register') {
      const x = await body(req);
      const email = normalizeEmail(x.email);
      const name = String(x.name || '').trim();
      const password = String(x.password || '');
      if (!validEmail(email)) return send(res, 400, { error: 'valid_email_required' });
      if (name.length < 2 || name.length > 120) return send(res, 400, { error: 'name_required' });
      if (password.length < 8 || password.length > 200) return send(res, 400, { error: 'password_minimum_8_characters' });
      if (state.customers.some(c => c.email === email)) return send(res, 409, { error: 'account_exists' });
      const { salt, hash } = hashPassword(password);
      const customer = { id: crypto.randomUUID(), email, name, role: 'customer', passwordSalt: salt, passwordHash: hash, createdAt: new Date().toISOString() };
      state.customers.push(customer);
      await persist();
      const accessToken = token();
      sessions.set(accessToken, customer.id);
      return send(res, 201, { customer: publicCustomer(customer), accessToken, tokenType: 'Bearer' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/login') {
      const x = await body(req);
      const email = normalizeEmail(x.email);
      const password = String(x.password || '');
      const customer = state.customers.find(c => c.email === email);
      if (!customer || !verifyPassword(password, { salt: customer.passwordSalt, passwordHash: customer.passwordHash })) return send(res, 401, { error: 'invalid_credentials' });
      const accessToken = token();
      sessions.set(accessToken, customer.id);
      return send(res, 200, { customer: publicCustomer(customer), accessToken, tokenType: 'Bearer' });
    }
    if (req.method === 'POST' && url.pathname === '/api/customer/logout') {
      const raw = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (raw) sessions.delete(raw);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/customer/dashboard') {
      const customer = sessionCustomer(req);
      if (!customer) return send(res, 401, { error: 'unauthorized' });
      return send(res, 200, { customer: publicCustomer(customer), next: ['browse products', 'view sellers and ratings', 'create an order when ordering is enabled'] });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    return send(res, Number(error.status) || 500, { error: error.message || 'internal_error' });
  }
}).listen(port, '127.0.0.1', () => console.log(JSON.stringify({ service: 'easy-customer-auth', port, customers: state.customers.length })));
