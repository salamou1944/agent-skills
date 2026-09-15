const DEFAULT_CAPABILITIES = Object.freeze([
  'discovery', 'verification', 'scoring', 'affiliate', 'digital_product',
  'api_product', 'micro_saas', 'data_product', 'publishing', 'analytics', 'billing'
]);

export function identifyCapabilityGaps({ required = [], available = DEFAULT_CAPABILITIES } = {}) {
  const have = new Set(available);
  return [...new Set(required)].filter((name) => !have.has(name)).map((name) => ({
    capability: name,
    type: inferType(name),
    status: 'missing',
    action: 'build_and_validate'
  }));
}

function inferType(name) {
  if (name.includes('api')) return 'api';
  if (['affiliate', 'publishing', 'analytics', 'billing'].includes(name)) return 'adapter';
  if (name.includes('product') || name.includes('discovery') || name.includes('verification')) return 'skill';
  return 'tool';
}

export function buildCapabilityPlan(gaps) {
  return gaps.map((gap, index) => ({
    ...gap,
    priority: index + 1,
    acceptance: ['implementation', 'failure_behavior', 'deterministic_test', 'ci_evidence']
  }));
}
