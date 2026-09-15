import assert from 'node:assert/strict';
import { TARGET_MARKETS, OFFER_CATALOG, selectOffers, buildCampaignPlan } from './market-strategy.mjs';

assert(TARGET_MARKETS.some((m) => m.code === 'US'));
assert(TARGET_MARKETS.some((m) => m.code === 'GB'));
assert(TARGET_MARKETS.every((m) => ['Europe', 'Americas'].includes(m.region)));
assert.equal(OFFER_CATALOG.length, 3);

const offers = selectOffers({ marketCodes: ['US', 'GB', 'DE'], audience: ['creators', 'video-makers'] });
assert.equal(offers[0].id, 'elevenlabs-affiliate');
assert(offers[0].marketCoverage >= 3);

const plan = buildCampaignPlan({ offer: offers[0], markets: TARGET_MARKETS.slice(0, 3) });
assert.equal(plan.offerId, 'elevenlabs-affiliate');
assert(plan.sequence.includes('measure_clicks_and_confirmed_conversions'));
assert(plan.compliance.includes('affiliate_disclosure'));
assert.equal(plan.revenueRule, 'count_only_provider_confirmed_commissions');

console.log('market-strategy: all deterministic tests passed');
