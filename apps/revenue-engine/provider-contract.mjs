export function assertProviderAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new Error('provider_adapter_required');
  const required = ['name', 'capabilities', 'healthCheck'];
  for (const key of required) if (!(key in adapter)) throw new Error(`provider_contract_missing:${key}`);
  if (typeof adapter.healthCheck !== 'function') throw new Error('provider_healthCheck_must_be_function');
  if (!Array.isArray(adapter.capabilities)) throw new Error('provider_capabilities_must_be_array');
  return true;
}

export function disabledProvider(name, reason = 'not_configured') {
  return Object.freeze({
    name,
    capabilities: [],
    async healthCheck() { return { ok: false, status: 'provider-unavailable', reason }; },
    async execute() { throw new Error(`provider_unavailable:${name}`); }
  });
}
