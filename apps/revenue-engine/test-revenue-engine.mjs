import assert from 'node:assert/strict';
import { createEngine, createOpportunity, verifyOpportunity, scoreOpportunity, planMonetization, recordRevenue } from './revenue-engine.mjs';

const good = createOpportunity({ title: 'Useful SaaS offer', source: 'provider.example', description: 'Public pricing, public terms, legitimate affiliate program.' });
assert.equal(good.status, 'discovered');

const verified = verifyOpportunity(good, { sourceReachable: true, offerExists: true, termsKnown: true, payoutKnown: true, identityKnown: true });
assert.equal(verified.status, 'verified');

const scored = scoreOpportunity(verified, { revenuePotential: 90, commission: 90, demand: 90, competition: 20, automation: 90, longevity: 90, payout: 90, risk: 5 });
assert.ok(scored.score >= 80);
assert.equal(scored.status, 'approved_for_build');

const plan = planMonetization(scored);
assert.ok(plan.primary);
assert.equal(plan.claims.revenue, 'unconfirmed_until_provider_event');

const engine = createEngine({ providers: { testAffiliate: { name: 'test' } } });
const blockedRevenue = engine.recordRevenue({ confirmed: true, provider: 'unknown', amount: 10 });
assert.equal(blockedRevenue.status, 'rejected');
const missingEventId = engine.recordRevenue({ confirmed: true, provider: 'testAffiliate', amount: 10 });
assert.equal(missingEventId.reason, 'provider_event_id_required');

const recorded = engine.recordRevenue({ confirmed: true, provider: 'testAffiliate', path: 'affiliate', amount: 10, currency: 'USD', externalEventId: 'evt-1' });
assert.equal(recorded.status, 'recorded');
assert.equal(recorded.amount, 10);
assert.equal(recorded.evidence.source, 'provider');
assert.equal(engine.recordRevenue({ confirmed: true, provider: 'testAffiliate', amount: 10, externalEventId: 'evt-1' }).reason, 'duplicate_provider_event');

const unsafe = createOpportunity({ title: 'Guaranteed income', source: 'x', description: 'spam and self-referral' });
assert.equal(unsafe.status, 'blocked');

const incomplete = verifyOpportunity(good, { sourceReachable: true });
assert.equal(incomplete.status, 'needs_verification');
assert.equal(scoreOpportunity(incomplete).score, null);

assert.equal(recordRevenue({ confirmed: true, provider: 'x', amount: 0 }, { x: {} }).status, 'rejected');

console.log('revenue-engine: all deterministic tests passed');
