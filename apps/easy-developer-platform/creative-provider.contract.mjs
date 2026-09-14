export const CREATIVE_PROVIDER_CONTRACT = Object.freeze({
  version: '0.1.0',
  required: ['name', 'analyzeAsset', 'generateCreative'],
  validationOwner: 'easy-creative-orchestrator',
  productionActivation: 'explicit-provider-selection',
  integrityOwner: 'easy-creative-core',
});

export function assertCreativeProvider(provider) {
  if (!provider || typeof provider.name !== 'string' || !provider.name.trim()) throw new Error('provider_name_required');
  for (const method of ['analyzeAsset', 'generateCreative']) {
    if (typeof provider[method] !== 'function') throw new Error(`provider_${method}_required`);
  }
  return true;
}
