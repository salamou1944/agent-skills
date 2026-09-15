import assert from 'node:assert/strict';
import { buildLaunchCampaign, buildLaunchTable } from './campaign-planner.mjs';

const campaign = buildLaunchCampaign();
assert.equal(campaign.offer.provider, 'ElevenLabs');
assert.deepEqual(campaign.markets.map((m) => m.code), ['US', 'GB', 'CA']);
assert.ok(campaign.gates.includes('affiliate_account_approved'));
assert.equal(campaign.revenueRule, 'confirmed_provider_event_only');
assert.ok(campaign.metrics.includes('confirmed_commission'));

const table = buildLaunchTable();
assert.equal(table.length, 6);
assert.equal(table[0].status, 'blocked_on_user_account');
assert.equal(table.at(-1).offer, 'Payoneer');

console.log('campaign-planner: all tests passed');
