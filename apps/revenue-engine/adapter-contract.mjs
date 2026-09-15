export const ADAPTER_STATES = Object.freeze(['disabled', 'ready', 'failed']);

export function assertAdapter(adapter, requiredMethods = []) {
  if (!adapter || typeof adapter !== 'object') throw new Error('adapter_required');
  if (!adapter.name) throw new Error('adapter_name_required');
  if (typeof adapter.healthCheck !== 'function') throw new Error(`adapter_healthCheck_required:${adapter.name}`);
  for (const method of requiredMethods) {
    if (typeof adapter[method] !== 'function') throw new Error(`adapter_method_required:${adapter.name}:${method}`);
  }
  return true;
}

export function disabledAdapter(name, reason = 'not_configured') {
  return Object.freeze({
    name,
    state: 'disabled',
    async healthCheck() { return { ok: false, state: 'disabled', reason }; },
    async execute() { throw new Error(`adapter_disabled:${name}:${reason}`); }
  });
}

export function providerConfig(name, env = process.env) {
  const key = `${String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_ENABLED`;
  return { enabled: env[key] === 'true', flag: key };
}
