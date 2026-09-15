import crypto from 'node:crypto';

const ID = () => `evt_${crypto.randomUUID()}`;

export function validateRevenueEvent(event = {}) {
  const errors = [];
  if (!event.provider) errors.push('provider_required');
  if (!event.externalEventId) errors.push('externalEventId_required');
  if (event.confirmed !== true) errors.push('confirmed_provider_event_required');
  if (typeof event.amount !== 'number' || !Number.isFinite(event.amount) || event.amount <= 0) errors.push('positive_amount_required');
  if (!event.currency || !/^[A-Z]{3}$/.test(String(event.currency))) errors.push('iso_currency_required');
  return { ok: errors.length === 0, errors };
}

export function createLedger({ clock = () => new Date().toISOString() } = {}) {
  const entries = new Map();
  return Object.freeze({
    append(event) {
      const validation = validateRevenueEvent(event);
      if (!validation.ok) return { status: 'rejected', ...validation };
      const key = `${event.provider}:${event.externalEventId}`;
      if (entries.has(key)) return { status: 'duplicate', entry: entries.get(key) };
      const entry = Object.freeze({ id: ID(), recordedAt: clock(), ...event });
      entries.set(key, entry);
      return { status: 'recorded', entry };
    },
    list() { return [...entries.values()]; },
    total({ currency } = {}) {
      return this.list().filter((e) => !currency || e.currency === currency).reduce((sum, e) => sum + e.amount, 0);
    }
  });
}
