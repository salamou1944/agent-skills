const MODALITIES = Object.freeze(["chat","image","audio","video","ocr","translation","embedding"]);

export function normalizeProviderCapabilities(provider = {}) {
  const capabilities = Array.isArray(provider.capabilities)
    ? provider.capabilities.filter(x => MODALITIES.includes(String(x)))
    : [];
  return Object.freeze({
    name: String(provider.name || "unknown"),
    endpoint: provider.endpoint || "",
    model: provider.model || "",
    capabilities: Object.freeze([...new Set(capabilities.map(String))]),
    priority: Number.isFinite(Number(provider.priority)) ? Number(provider.priority) : 100,
    costPerUnit: Number.isFinite(Number(provider.costPerUnit)) ? Math.max(0, Number(provider.costPerUnit)) : null,
    healthy: provider.healthy !== false,
  });
}

export function discoverProviders(providers = [], modality) {
  const wanted = String(modality || "").toLowerCase();
  if (!MODALITIES.includes(wanted)) return [];
  return providers
    .map(normalizeProviderCapabilities)
    .filter(p => p.healthy && p.capabilities.includes(wanted) && p.endpoint && p.model)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.costPerUnit === null && b.costPerUnit !== null) return 1;
      if (a.costPerUnit !== null && b.costPerUnit === null) return -1;
      return (a.costPerUnit ?? 0) - (b.costPerUnit ?? 0) || a.name.localeCompare(b.name);
    });
}

export function chooseProvider(providers = [], modality, { maxCostPerUnit = null } = {}) {
  const candidates = discoverProviders(providers, modality)
    .filter(p => maxCostPerUnit === null || p.costPerUnit === null || p.costPerUnit <= maxCostPerUnit);
  return candidates[0] || null;
}

export { MODALITIES };
