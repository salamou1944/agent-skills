import assert from 'node:assert/strict';
import { createLedger } from './event-ledger.mjs';
import { assertAdapter, disabledAdapter } from './adapter-contract.mjs';
import { identifyCapabilityGaps, buildCapabilityPlan } from './capability-planner.mjs';

const ledger = createLedger({ clock: () => '2026-01-01T00:00:00.000Z' });
assert.deepEqual(ledger.append({ provider: 'test', externalEventId: '1', confirmed: true, amount: 5, currency: 'USD' }).status, 'recorded');
assert.deepEqual(ledger.append({ provider: 'test', externalEventId: '1', confirmed: true, amount: 5, currency: 'USD' }).status, 'duplicate');
assert.equal(ledger.total({ currency: 'USD' }), 5);
assert.equal(ledger.append({ provider: 'test', externalEventId: '2', confirmed: false, amount: 5, currency: 'USD' }).status, 'rejected');

const disabled = disabledAdapter('test-provider');
assertAdapter(disabled, ['execute']);
assert.equal((await disabled.healthCheck()).state, 'disabled');
await assert.rejects(() => disabled.execute(), /adapter_disabled:test-provider/);

const gaps = identifyCapabilityGaps({ required: ['discovery', 'publishing', 'new_ai_channel'], available: ['discovery'] });
assert.deepEqual(gaps.map((x) => x.capability), ['publishing', 'new_ai_channel']);
assert.deepEqual(buildCapabilityPlan(gaps).map((x) => x.acceptance.length), [4, 4]);

console.log('revenue-components: all deterministic tests passed');
