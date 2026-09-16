import crypto from 'node:crypto';
import { assertProviderAdapter } from './provider-contract.mjs';

const CATEGORIES = Object.freeze(['discovery', 'affiliate', 'publishing', 'billing', 'analytics']);
const DEFAULT_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 5000;

function env(name) { return String(process.env[name] || '').trim(); }
function endpointFor(category) { return env(`REVENUE_${category.toUpperCase()}_URL`); }
function tokenFor(category) { return env(`REVENUE_${category.toUpperCase()}_TOKEN`); }
function assertHttps(url, category) {
  if (!url) throw new Error(`provider_endpoint_missing:${category}`);
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error(`provider_endpoint_invalid:${category}`); }
  if (parsed.protocol !== 'https:') throw new Error(`provider_endpoint_requires_https:${category}`);
  return parsed.toString();
}
function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, MAX_RETRY_DELAY_MS);
  return Math.min(250 * (2 ** attempt), MAX_RETRY_DELAY_MS);
}
function retryableStatus(status) { return status === 408 || status === 425 || status === 429 || status >= 500; }

export function createHttpProviderAdapter(category, { fetchImpl = globalThis.fetch, retries = DEFAULT_RETRIES, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  if (!CATEGORIES.includes(category)) throw new Error(`unsupported_provider_category:${category}`);
  const name = `http-${category}`;
  const capabilities = category === 'discovery' ? ['discover'] : category === 'affiliate' ? ['tracking_url'] : category === 'publishing' ? ['publish'] : category === 'billing' ? ['checkout', 'webhook'] : ['event_ingest'];
  const adapter = {
    name,
    category,
    capabilities,
    configured: Boolean(endpointFor(category)),
    async healthCheck() {
      const endpoint = endpointFor(category);
      if (!endpoint) return { ok: false, status: 'provider-unavailable', provider: name, reason: 'endpoint_missing' };
      let url;
      try { url = assertHttps(endpoint, category); } catch (error) { return { ok: false, status: 'provider-invalid', provider: name, reason: error.message }; }
      if (typeof fetchImpl !== 'function') return { ok: false, status: 'provider-unavailable', provider: name, reason: 'fetch_unavailable' };
      try {
        const response = await fetchImpl(url, { method: 'HEAD', headers: authHeaders(category) });
        if (response.ok) return { ok: true, status: 'ready', provider: name, httpStatus: response.status };
        if (response.status === 405) {
          const fallback = await fetchImpl(url, { method: 'GET', headers: authHeaders(category) });
          if (fallback.ok) return { ok: true, status: 'ready', provider: name, httpStatus: fallback.status, healthMethod: 'GET' };
          return { ok: false, status: 'provider-http-error', provider: name, httpStatus: fallback.status, retryAfter: fallback.headers?.get?.('retry-after') || null };
        }
        return { ok: false, status: 'provider-http-error', provider: name, httpStatus: response.status, retryAfter: response.headers?.get?.('retry-after') || null };
      } catch (error) {
        return { ok: false, status: 'provider-unreachable', provider: name, reason: error.message };
      }
    },
    async execute(input = {}) {
      const endpoint = assertHttps(endpointFor(category), category);
      if (typeof fetchImpl !== 'function') throw new Error('fetch_unavailable');
      const maxRetries = Math.max(0, Number(retries) || 0);
      for (let attempt = 0; ; attempt += 1) {
        let response;
        try {
          response = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders(category) }, body: JSON.stringify(input) });
        } catch (error) {
          if (attempt >= maxRetries) throw error;
          await sleep(Math.min(250 * (2 ** attempt), MAX_RETRY_DELAY_MS));
          continue;
        }
        const text = await response.text();
        if (response.ok) {
          let data = {};
          if (text) { try { data = JSON.parse(text); } catch { data = { raw: text }; } }
          return { ok: true, provider: name, attempts: attempt + 1, ...data };
        }
        if (!retryableStatus(response.status) || attempt >= maxRetries) {
          const error = new Error(`provider_http_${response.status}`);
          error.status = response.status;
          error.retryAfter = response.headers?.get?.('retry-after') || null;
          error.attempts = attempt + 1;
          throw error;
        }
        await sleep(retryDelayMs(response, attempt));
      }
    }
  };
  assertProviderAdapter(adapter);
  return adapter;
}

function authHeaders(category) {
  const token = tokenFor(category);
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function createLiveProviderRegistry(options = {}) {
  return Object.fromEntries(CATEGORIES.map((category) => [category, createHttpProviderAdapter(category, options)]));
}

export function signRevenueEvent(payload, secret = env('REVENUE_WEBHOOK_SECRET')) {
  if (!secret) throw new Error('revenue_webhook_secret_missing');
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

export function verifyRevenueEventSignature(payload, signature, secret = env('REVENUE_WEBHOOK_SECRET')) {
  if (!secret || !signature) return false;
  const expected = signRevenueEvent(payload, secret);
  const a = Buffer.from(String(signature), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
