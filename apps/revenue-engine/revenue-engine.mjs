import crypto from 'node:crypto';

const PATHS = Object.freeze({
  affiliate: { weight: 0.25, label: 'Affiliate' },
  digital_product: { weight: 0.20, label: 'Digital product' },
  api: { weight: 0.20, label: 'API' },
  micro_saas: { weight: 0.20, label: 'Micro-SaaS' },
  data_product: { weight: 0.15, label: 'Data / opportunity' }
});

const BLOCKED = [
  /self[- ]?referral/i,
  /fake account/i,
  /cookie stuffing/i,
  /spam/i,
  /misleading/i,
  /guaranteed income/i,
  /credential harvesting/i
];

function id(prefix = 'rev') { return `${prefix}_${crypto.randomUUID()}`; }
function now() { return new Date().toISOString(); }
function clamp(n, min = 0, max = 100) { return Math.max(min, Math.min(max, Number(n) || 0)); }

export function createOpportunity(input = {}) {
  const title = String(input.title || '').trim();
  const source = String(input.source || '').trim();
  const description = String(input.description || '').trim();
  if (!title || !source || !description) throw new Error('title_source_description_required');
  const text = `${title} ${source} ${description}`;
  const blockedReason = BLOCKED.find((rx) => rx.test(text));
  return {
    id: id('opp'), title, source, description,
    discoveredAt: now(), status: blockedReason ? 'blocked' : 'discovered',
    blockedReason: blockedReason?.source || null,
    evidence: [], score: null, routes: []
  };
}

export function verifyOpportunity(opportunity, evidence = {}) {
  if (!opportunity || opportunity.status === 'blocked') return { ...opportunity, status: 'blocked' };
  const checks = {
    sourceReachable: Boolean(evidence.sourceReachable),
    offerExists: Boolean(evidence.offerExists),
    termsKnown: Boolean(evidence.termsKnown),
    payoutKnown: Boolean(evidence.payoutKnown),
    identityKnown: Boolean(evidence.identityKnown)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const verified = passed === Object.keys(checks).length;
  return { ...opportunity, status: verified ? 'verified' : 'needs_verification', evidence: checks };
}

export function scoreOpportunity(opportunity, metrics = {}) {
  if (!opportunity || opportunity.status !== 'verified') return { ...opportunity, score: null, routes: [] };
  const values = {
    revenuePotential: clamp(metrics.revenuePotential),
    commission: clamp(metrics.commission),
    demand: clamp(metrics.demand),
    competition: 100 - clamp(metrics.competition),
    automation: clamp(metrics.automation),
    longevity: clamp(metrics.longevity),
    payout: clamp(metrics.payout),
    risk: 100 - clamp(metrics.risk)
  };
  const score = Math.round(
    values.revenuePotential * .25 + values.commission * .20 + values.demand * .15 +
    values.competition * .10 + values.automation * .10 + values.longevity * .10 +
    values.payout * .05 + values.risk * .05
  );
  const routes = Object.entries(PATHS)
    .map(([path, meta]) => ({ path, score: Math.round(score * meta.weight + values.automation * (1 - meta.weight)) }))
    .sort((a, b) => b.score - a.score);
  return { ...opportunity, score, routeScores: routes, status: score >= 80 ? 'approved_for_build' : score >= 60 ? 'queued' : 'rejected' };
}

export function planMonetization(opportunity) {
  if (!['approved_for_build', 'queued'].includes(opportunity?.status)) throw new Error('opportunity_not_eligible');
  const ranked = [...(opportunity.routeScores || [])].sort((a, b) => b.score - a.score);
  return {
    id: id('plan'), opportunityId: opportunity.id,
    generatedAt: now(), mode: 'fail-closed',
    primary: ranked[0]?.path || null,
    secondary: ranked.slice(1, 3).map((x) => x.path),
    stages: [
      'package_value', 'provider_check', 'content_draft', 'compliance_check',
      'publish_after_approval', 'measure_confirmed_events', 'optimize'
    ],
    claims: { revenue: 'unconfirmed_until_provider_event' }
  };
}

export function fanOut(opportunity, plan) {
  const enabled = new Set([plan.primary, ...(plan.secondary || [])].filter(Boolean));
  return Object.keys(PATHS).map((path) => ({
    id: id('asset'), opportunityId: opportunity.id, path,
    enabled: enabled.has(path), status: enabled.has(path) ? 'planned' : 'not_selected',
    requiredProvider: providerFor(path)
  }));
}

function providerFor(path) {
  return ({
    affiliate: 'affiliate-network-adapter',
    digital_product: 'storefront-adapter',
    api: 'api-marketplace-adapter',
    micro_saas: 'billing-and-app-adapter',
    data_product: 'data-store-and-alert-adapter'
  })[path];
}

export function recordRevenue(event, providerRegistry = {}) {
  if (!event?.confirmed || !event?.provider || !providerRegistry[event.provider]) {
    return { status: 'rejected', reason: 'revenue_requires_confirmed_provider_event' };
  }
  if (typeof event.amount !== 'number' || !Number.isFinite(event.amount) || event.amount <= 0) {
    return { status: 'rejected', reason: 'invalid_amount' };
  }
  return {
    status: 'recorded', id: id('txn'), recordedAt: now(), provider: event.provider,
    path: event.path || 'unknown', amount: event.amount, currency: event.currency || 'USD',
    externalEventId: String(event.externalEventId || '')
  };
}

export function createEngine({ providers = {}, mode = 'dry-run' } = {}) {
  const providerRegistry = Object.freeze({ ...providers });
  return Object.freeze({
    mode,
    providers: Object.keys(providerRegistry),
    discover: createOpportunity,
    verify: verifyOpportunity,
    score: scoreOpportunity,
    plan: planMonetization,
    fanOut,
    recordRevenue: (event) => recordRevenue(event, providerRegistry)
  });
}

export function demo() {
  const engine = createEngine();
  let opportunity = engine.discover({
    title: 'AI automation platform affiliate offer',
    source: 'example-provider',
    description: 'A legitimate SaaS offer with public pricing and an affiliate program.'
  });
  opportunity = engine.verify(opportunity, {
    sourceReachable: true, offerExists: true, termsKnown: true, payoutKnown: true, identityKnown: true
  });
  opportunity = engine.score(opportunity, {
    revenuePotential: 90, commission: 85, demand: 82, competition: 35,
    automation: 95, longevity: 80, payout: 90, risk: 10
  });
  const plan = engine.plan(opportunity);
  return { opportunity, plan, assets: engine.fanOut(opportunity, plan), revenueBeforeProvider: engine.recordRevenue({ confirmed: true, provider: 'missing', amount: 10 }) };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(demo(), null, 2));
