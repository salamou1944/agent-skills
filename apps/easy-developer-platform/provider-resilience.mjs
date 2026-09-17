#!/usr/bin/env node

const DEFAULTS = Object.freeze({ retries: 3, baseDelayMs: 500, maxDelayMs: 15_000, failureThreshold: 3, cooldownMs: 30_000 });

export function classifyProviderError(error) {
  const message = String(error?.message || error || 'provider_error');
  const status = Number(error?.status || message.match(/provider_http_(\d{3})/)?.[1] || 0);
  if (status === 429 || /quota/i.test(message)) return 'rate_limited_or_quota';
  if (status === 408 || /timeout|abort/i.test(message)) return 'timeout';
  if (status >= 500) return 'transient_server';
  if (status === 404 || status === 410) return 'provider_unavailable';
  return 'non_recoverable';
}

export function backoffMs(attempt, retryAfterMs = null, options = {}) {
  const o = { ...DEFAULTS, ...options };
  if (Number.isFinite(retryAfterMs) && retryAfterMs >= 0) return Math.min(retryAfterMs, o.maxDelayMs);
  return Math.min(o.baseDelayMs * (2 ** Math.max(0, attempt - 1)) + Math.floor(Math.random() * 250), o.maxDelayMs);
}

export function createCircuitBreaker(options = {}) {
  const o = { ...DEFAULTS, ...options };
  let failures = 0;
  let openedAt = 0;
  return {
    canRequest(now = Date.now()) { return !openedAt || now - openedAt >= o.cooldownMs; },
    recordSuccess() { failures = 0; openedAt = 0; },
    recordFailure(now = Date.now()) { failures += 1; if (failures >= o.failureThreshold) openedAt = now; },
    state() { return { failures, opened: Boolean(openedAt), openedAt }; }
  };
}

export async function resilientExecute(providers, execute, { retries = DEFAULTS.retries, sleep = (ms) => new Promise(r => setTimeout(r, ms)), telemetry = () => {}, ...options } = {}) {
  const breakers = new Map();
  const failures = [];
  for (const provider of providers || []) {
    const name = provider?.name || 'unknown';
    const breaker = breakers.get(name) || createCircuitBreaker(options);
    breakers.set(name, breaker);
    if (!breaker.canRequest()) { failures.push(`${name}:circuit_open`); continue; }
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        const result = await execute(provider, attempt);
        breaker.recordSuccess();
        telemetry({ provider: name, attempt, outcome: 'success' });
        return result;
      } catch (error) {
        const kind = classifyProviderError(error);
        telemetry({ provider: name, attempt, outcome: 'failure', kind });
        if (kind === 'non_recoverable' || attempt === retries) { breaker.recordFailure(); failures.push(`${name}:${kind}`); break; }
        breaker.recordFailure();
        const retryAfterMs = Number(error?.retryAfterMs);
        await sleep(backoffMs(attempt, Number.isFinite(retryAfterMs) ? retryAfterMs : null, options));
      }
    }
  }
  const error = new Error(`all_providers_exhausted:${failures.join(',')}`);
  error.failures = failures;
  throw error;
}
