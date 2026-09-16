import { createEngine } from './revenue-engine.mjs';
import { createRevenueApi } from './revenue-api.mjs';
import { createElevenLabsAffiliateAdapter } from './elevenlabs-affiliate-adapter.mjs';
import { createHostingerAffiliateAdapter, createPayoneerAffiliateAdapter } from './secondary-affiliate-adapters.mjs';
import { createServer } from 'node:http';

const requestedMode = process.env.REVENUE_ENGINE_MODE || 'dry-run';
const allowedModes = new Set(['dry-run', 'live']);
if (!allowedModes.has(requestedMode)) throw new Error(`invalid_revenue_engine_mode:${requestedMode}`);

const providerNames = {
  discovery: 'REVENUE_DISCOVERY_PROVIDER',
  affiliate: 'REVENUE_AFFILIATE_PROVIDER',
  publishing: 'REVENUE_PUBLISH_PROVIDER',
  billing: 'REVENUE_BILLING_PROVIDER',
  analytics: 'REVENUE_ANALYTICS_PROVIDER'
};

function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
function providerState() { return Object.fromEntries(Object.entries(providerNames).map(([key, env]) => [key, Boolean(process.env[env])])); }
function missingProviders(providers) { return Object.entries(providers).filter(([, configured]) => !configured).map(([key]) => key); }
function createProviders() {
  return {
    'elevenlabs-affiliate': createElevenLabsAffiliateAdapter(),
    'hostinger-affiliate': createHostingerAffiliateAdapter(),
    'payoneer-affiliate': createPayoneerAffiliateAdapter()
  };
}

function doctor() {
  const providers = providerState();
  const missing = missingProviders(providers);
  const adapters = Object.values(createProviders());
  const livePrerequisites = missing.length
    ? [`configure_provider_categories:${missing.join(',')}`, 'implement_and_health-check_provider_adapters', 'collect_provider_integration_evidence']
    : ['implement_and_health-check_provider_adapters', 'collect_provider_integration_evidence'];
  return {
    ok: requestedMode !== 'live',
    mode: requestedMode,
    providers,
    missingProviders: missing,
    configuredProviders: Object.values(providers).filter(Boolean).length,
    affiliateAdapters: adapters.map((adapter) => ({ name: adapter.name, configured: adapter.name === 'elevenlabs-affiliate' ? Boolean(process.env.ELEVENLABS_AFFILIATE_LINK) : adapter.name === 'hostinger-affiliate' ? Boolean(process.env.HOSTINGER_AFFILIATE_LINK) : Boolean(process.env.PAYONEER_AFFILIATE_LINK) })),
    activation: requestedMode === 'live' ? 'blocked-until-provider-adapters-pass-health-and-integration' : 'dry-run-ready',
    activationReady: false,
    nextAction: requestedMode === 'live' ? livePrerequisites[0] : 'use_dry_run_or_fixture_boundaries_until_live_evidence_exists',
    livePrerequisites,
    rule: 'A provider variable alone never activates production. Adapter contract, health check, and integration evidence are required.'
  };
}

async function affiliateStatus() {
  const adapters = Object.values(createProviders());
  const status = [];
  for (const adapter of adapters) {
    const health = await adapter.healthCheck();
    status.push({ provider: adapter.name, health, trackingUrlPresent: health.ok });
  }
  return { ok: status.some((item) => item.health.ok), affiliates: status };
}

function assertLiveActivation() {
  const providers = providerState();
  const missing = missingProviders(providers);
  if (missing.length) throw new Error(`live_activation_blocked:missing_providers:${missing.join(',')}`);
  throw new Error('live_activation_blocked:provider_adapters_and_health_registry_required');
}

function demo() {
  const engine = createEngine({ mode: 'dry-run', providers: createProviders() });
  const opportunity = engine.discover({ title: 'Example verified developer productivity offer', source: 'https://example.com/offer', description: 'Deterministic demonstration only; not a live offer.' });
  const verified = engine.verify(opportunity, { sourceReachable: true, offerExists: true, termsKnown: true, payoutKnown: true, identityKnown: true });
  const scored = engine.score(verified, { revenuePotential: 90, commission: 85, demand: 82, competition: 35, automation: 95, longevity: 80, payout: 90, risk: 10 });
  const plan = engine.plan(scored);
  return { opportunity: scored, plan, assets: engine.fanOut(scored, plan) };
}

const command = process.argv[2] || 'doctor';
if (command === 'doctor') print(doctor());
else if (command === 'affiliate-status') print(await affiliateStatus());
else if (command === 'demo') print(demo());
else if (command === 'serve') {
  if (requestedMode === 'live') assertLiveActivation();
  const engine = createEngine({ mode: requestedMode, providers: createProviders() });
  const port = Number(process.env.REVENUE_ENGINE_PORT || 8787);
  createServer(createRevenueApi({ engine })).listen(port, '127.0.0.1', () => console.log(`revenue-engine ready on 127.0.0.1:${port} (${requestedMode})`));
} else {
  console.error(`unknown_command:${command}`);
  process.exitCode = 2;
}
