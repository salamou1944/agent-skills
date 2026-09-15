import { createEngine } from './revenue-engine.mjs';
import { createRevenueApi } from './revenue-api.mjs';
import { createServer } from 'node:http';

const engine = createEngine({ mode: 'dry-run' });

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function doctor() {
  const providers = {
    discovery: Boolean(process.env.REVENUE_DISCOVERY_PROVIDER),
    affiliate: Boolean(process.env.REVENUE_AFFILIATE_PROVIDER),
    publishing: Boolean(process.env.REVENUE_PUBLISH_PROVIDER),
    billing: Boolean(process.env.REVENUE_BILLING_PROVIDER),
    analytics: Boolean(process.env.REVENUE_ANALYTICS_PROVIDER)
  };
  const configured = Object.values(providers).filter(Boolean).length;
  return {
    ok: true,
    mode: engine.mode,
    providers,
    configuredProviders: configured,
    activation: configured === 0 ? 'dry-run-ready' : 'provider-configuration-required',
    rule: 'No provider is treated as live until its adapter contract and integration test pass.'
  };
}

function demo() {
  const opportunity = engine.discover({
    title: 'Example verified developer productivity offer',
    sourceUrl: 'https://example.com/offer',
    payer: 'provider',
    monetization: 'affiliate',
    evidence: ['official-terms', 'official-payout-policy'],
    termsUrl: 'https://example.com/terms'
  });
  const verified = engine.verify(opportunity, {
    sourceReachable: true,
    offerExists: true,
    termsVerified: true,
    payoutVerified: true,
    eligibilityVerified: true
  });
  return { opportunity, verified, score: engine.score(opportunity, { demand: 8, margin: 8, competition: 5, execution: 9, risk: 2 }) };
}

const command = process.argv[2] || 'doctor';
if (command === 'doctor') print(doctor());
else if (command === 'demo') print(demo());
else if (command === 'serve') {
  const port = Number(process.env.REVENUE_ENGINE_PORT || 8787);
  createServer(createRevenueApi({ engine })).listen(port, '127.0.0.1', () => {
    console.log(`revenue-engine ready on 127.0.0.1:${port} (dry-run)`);
  });
} else {
  console.error(`unknown_command:${command}`);
  process.exitCode = 2;
}
