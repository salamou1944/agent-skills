import assert from 'node:assert/strict';
import { SERVICE_MARKET_SOURCES, SERVICE_OFFERS, rankServices, buildTargetProfile, buildProspectingQueries } from './service-market-intelligence.mjs';

assert.ok(SERVICE_MARKET_SOURCES.length >= 4);
assert.equal(SERVICE_OFFERS.find((x) => x.id === 'ecommerce-listing-optimization')?.buildStatus, 'implemented');
const ranked = rankServices();
assert.equal(ranked.length, 3);
assert.ok(ranked.every((x) => Number.isFinite(x.marketSignalScore)));
const target = buildTargetProfile('ecommerce-listing-optimization');
assert.deepEqual(target.markets, ['US', 'GB', 'CA', 'DE', 'FR', 'NL']);
assert.ok(target.buyerTitles.length > 0);
assert.ok(target.buyingTriggers.length > 0);
const queries = buildProspectingQueries('ecommerce-listing-optimization', { markets: ['US', 'GB'] });
assert.equal(queries.length, 6);
assert.ok(queries.every((x) => x.query.includes('AI automation')));
assert.throws(() => buildTargetProfile('missing'), /service_not_found/);
console.log('service-market-intelligence: ok');
