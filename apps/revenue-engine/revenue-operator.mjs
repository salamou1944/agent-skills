import { createEngine } from './revenue-engine.mjs';
import { createRevenueApi } from './revenue-api.mjs';
import { createElevenLabsAffiliateAdapter } from './elevenlabs-affiliate-adapter.mjs';
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

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function providerState() {
  return Object.fromEntries(Object.entries(providerNames).map(([key, env]) => [key, Boolean(process.env[env])]));
}

function createProviders() {
  return { 'elevenlabs-affiliate': createElevenLabsAffiliateAdapter() };
}

function doctor() {
  const providers = providerState();
  const configured = Object.values(providers).filter(Boolean).length;
  const elevenlabs = createElevenLabsAffiliateAdapter();
  const liveBlocked = requestedMode === 'live';
  return {
    ok: !liveBlocked,
    mode: requestedMode,
    providers,
    configuredProviders: configured,
    elevenLabsAffiliate: {
      configured: Boolean(process.env.ELEVENLABS_AFFILIATE_LINK),
      adapter: elevenlabs.name
    },
    activation: liveBlocked ? 'blocked-until-provider-adapters-pass-health-and-integration' : 'dry-run-ready',
    rule: 'A provider variable alone never activates production. Adapter contract, health check, and integration evidence are required.'
  };
}

async function affiliateStatus() {
  const adapter = createElevenLabsAffiliateAdapter();
  const health = await adapter.healthCheck();
  const result = await adapter.execute({ action: 'tracking_url' });
  return {
    provider: adapter.name,
    health,
    trackingConfigured: Boolean(result.trackingUrl),
    trackingUrlPresent: Boolean(result.trackingUrl)
  };
}

function assertLiveActivation() {
  const providers = providerState();
  const missing = Object.entries(providers).filter(([, configured]) => !configured).map(([key]) => key);
  if (missing.length) throw new Error(`live_activation_blocked:missing_providers:${missing.join(',')}`);
  throw new Error('live_activation_blocked:provider_adapters_and_health_registry_required');
}

function demo() {
  const engine = createEngine({ mode: 'dry-run', providers: createProviders() });
  const opportunity = engine.discover({
    title: 'Example verified developer productivity offer',
    source: 'https://example.com/offer',
    description: 'Deterministic demonstration only; not a live offer.',
  });
  const verified = engine.verify(opportunity, {
    sourceReachable: true,
    offerExists: true,
    termsKnown: true,
    payoutKnown: true,
    identityKnown: true
  });
  const scored = engine.score(verified, {
    revenuePotential: 90,
    commission: 85,
    demand: 82,
    competition: 35,
    automation: 95,
    longevity: 80,
    payout: 90,
    risk: 10
  });
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
  createServer(createRevenueApi({ engine })).listen(port, '127.0.0.1', () => {
    console.log(`revenue-engine ready on 127.0.0.1:${port} (${requestedMode})`);
  });
} else {
  console.error(`unknown_command:${command}`);
  process.exitCode = 2;
}
