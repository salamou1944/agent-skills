export function providerContract(provider, requiredMethods = []) {
  if (!provider || typeof provider !== 'object') return { ready: false, reason: 'provider_missing' };
  const missing = requiredMethods.filter(name => typeof provider[name] !== 'function');
  return missing.length ? { ready: false, reason: 'provider_contract_incomplete', missing } : { ready: true, reason: 'provider_contract_valid' };
}

export function envProvider(name, requiredMethods = []) {
  const modulePath = process.env[name];
  if (!modulePath) return { ready: false, reason: 'provider_not_configured', provider: null };
  return { ready: false, reason: 'provider_adapter_requires_explicit_import', provider: modulePath, requiredMethods };
}
