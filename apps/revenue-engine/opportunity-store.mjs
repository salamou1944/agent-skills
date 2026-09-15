import crypto from 'node:crypto';

const ID = () => `opp_${crypto.randomUUID()}`;

export function createOpportunityStore() {
  const data = new Map();
  return Object.freeze({
    put(opportunity) {
      if (!opportunity?.id) throw new Error('opportunity_id_required');
      data.set(opportunity.id, structuredClone(opportunity));
      return structuredClone(data.get(opportunity.id));
    },
    create(input) {
      const opportunity = { id: ID(), createdAt: new Date().toISOString(), status: 'discovered', ...input };
      return this.put(opportunity);
    },
    get(id) { return data.has(id) ? structuredClone(data.get(id)) : null; },
    list({ status } = {}) { return [...data.values()].filter((x) => !status || x.status === status).map(structuredClone); },
    update(id, patch) {
      const current = this.get(id);
      if (!current) throw new Error('opportunity_not_found');
      return this.put({ ...current, ...patch, updatedAt: new Date().toISOString() });
    }
  });
}
