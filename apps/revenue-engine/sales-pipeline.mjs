import crypto from 'node:crypto';

export const SALES_STAGES = Object.freeze([
  'found', 'submitted', 'replied', 'call', 'accepted', 'paid', 'delivery', 'recurring'
]);

const ID = () => `sale_${crypto.randomUUID()}`;

export function createSalesPipeline() {
  const data = new Map();
  const get = (id) => data.has(id) ? structuredClone(data.get(id)) : null;

  function create(input = {}) {
    const now = new Date().toISOString();
    const item = {
      id: ID(),
      createdAt: now,
      updatedAt: now,
      stage: 'found',
      product: 'ai-product-listing-generator',
      ...input,
      stage: input.stage || 'found'
    };
    if (!SALES_STAGES.includes(item.stage)) throw new Error('invalid_sales_stage');
    data.set(item.id, structuredClone(item));
    return structuredClone(item);
  }

  function advance(id, stage, evidence = {}) {
    if (!SALES_STAGES.includes(stage)) throw new Error('invalid_sales_stage');
    const current = get(id);
    if (!current) throw new Error('sale_not_found');
    const from = SALES_STAGES.indexOf(current.stage);
    const to = SALES_STAGES.indexOf(stage);
    if (to < from) throw new Error('sales_stage_regression');
    const updated = { ...current, stage, updatedAt: new Date().toISOString(), evidence: { ...(current.evidence || {}), ...evidence } };
    data.set(id, structuredClone(updated));
    return structuredClone(updated);
  }

  function list(stage) {
    if (stage && !SALES_STAGES.includes(stage)) throw new Error('invalid_sales_stage');
    return [...data.values()].filter((x) => !stage || x.stage === stage).map(structuredClone);
  }

  return Object.freeze({ create, get, advance, list });
}
