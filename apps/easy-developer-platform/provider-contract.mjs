export const PROVIDER_CONTRACT_VERSION = 2;
export const PROVIDER_EVIDENCE_LEVELS = Object.freeze(['configured','reachable','executed','result_verified']);

export function providerContract(provider, requiredMethods = [], { capabilities = [], requireVersion = true } = {}) {
  if (!provider || typeof provider !== 'object') return { ready: false, reason: 'provider_missing', version: PROVIDER_CONTRACT_VERSION };
  const missing = requiredMethods.filter(name => typeof provider[name] !== 'function');
  const versionOk = !requireVersion || provider.contractVersion === undefined || Number(provider.contractVersion) >= PROVIDER_CONTRACT_VERSION;
  if (!versionOk) return { ready:false, reason:'provider_contract_version_unsupported', requiredVersion:PROVIDER_CONTRACT_VERSION, version:provider.contractVersion };
  const advertised = new Set(Array.isArray(provider.capabilities) ? provider.capabilities : []);
  const missingCapabilities = capabilities.filter(capability => !advertised.has(capability));
  if (missing.length || missingCapabilities.length) return { ready:false, reason:'provider_contract_incomplete', missing, missingCapabilities, version:PROVIDER_CONTRACT_VERSION };
  return { ready:true, reason:'provider_contract_valid', version:PROVIDER_CONTRACT_VERSION, capabilities:[...advertised] };
}

export function assertProviderAdapter(provider, requiredMethods = []) {
  const contract = providerContract(provider, requiredMethods, { requireVersion:false });
  if (!contract.ready) throw new Error(`provider_contract_invalid:${contract.reason}`);
  return provider;
}

export function providerEvidence({ configured=false, reachable=false, executed=false, resultVerified=false } = {}) {
  const flags={configured:Boolean(configured),reachable:Boolean(reachable),executed:Boolean(executed),resultVerified:Boolean(resultVerified)};
  const level=flags.resultVerified?'result_verified':flags.executed?'executed':flags.reachable?'reachable':flags.configured?'configured':'unconfigured';
  return {...flags,level};
}

export function envProvider(name, requiredMethods = []) {
  const modulePath=process.env[name];
  if(!modulePath) return {ready:false,reason:'provider_not_configured',provider:null,version:PROVIDER_CONTRACT_VERSION};
  return {ready:false,reason:'provider_adapter_requires_explicit_import',provider:modulePath,requiredMethods,version:PROVIDER_CONTRACT_VERSION};
}
