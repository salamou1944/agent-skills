#!/usr/bin/env node

const base = String(process.env.EASY_PUBLIC_URL || '').replace(/\/$/, '');

export function evaluateHumanTrialReadiness({
  gateway = null,
  integration = null,
  creativeHealth = null,
  creativeProvider = null,
  creativeSelfTest = null,
  customerHealth = null,
  revenueHealth = null,
  runtimeIdentity = null,
  humanTrialAuthorized = false
} = {}) {
  const providerBlocked = creativeSelfTest?.status === 503 &&
    ['provider_http_429', 'credit_balance_exhausted'].includes(String(creativeSelfTest?.reason || creativeSelfTest?.body?.reason || '').toLowerCase());

  const checks = [
    { name: 'gateway', pass: gateway?.status === 200 && gateway?.body?.platformOnline === true && gateway?.body?.operatorOnline === true },
    { name: 'integration', pass: integration?.status === 200 && /EASY Developer Platform/.test(String(integration?.body || '')) },
    { name: 'creative-job-health', pass: creativeHealth?.status === 200 && Boolean(creativeHealth?.body?.status) },
    { name: 'creative-provider', pass: creativeProvider?.status === 200 && creativeProvider?.body?.status === 'READY' && creativeProvider?.body?.generationEnabled === true },
    { name: 'creative-provider-e2e', pass: creativeSelfTest?.status === 200 && creativeSelfTest?.body?.status === 'PASS' },
    { name: 'customer-health', pass: customerHealth?.status === 200 && customerHealth?.body?.persistent === true },
    { name: 'revenue-health', pass: revenueHealth?.status === 200 && revenueHealth?.body?.ok === true },
    { name: 'runtime-identity', pass: Boolean(runtimeIdentity?.runtimeCommit || runtimeIdentity?.deploymentId) },
    { name: 'human-trial-authorization', pass: humanTrialAuthorized === true }
  ];

  const failed = checks.filter(check => !check.pass).map(check => check.name);
  if (providerBlocked) {
    return {
      decision: 'BLOCKED_EXTERNAL_DEPENDENCY',
      reason: 'creative_provider_credit_exhausted',
      checks: checks.map(check => ({ name: check.name, status: check.pass ? 'PASS' : 'FAIL' })),
      risks: [...new Set([...failed, 'external_provider_credit_exhausted'])]
    };
  }

  return {
    decision: failed.length === 0 ? 'HUMAN_READY' : 'VERIFICATION_FAILED',
    checks: checks.map(check => ({ name: check.name, status: check.pass ? 'PASS' : 'FAIL' })),
    risks: failed
  };
}

async function get(path) {
  try {
    const response = await fetch(base + path, { redirect: 'manual' });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    return { path, status: response.status, ok: response.ok, body, text };
  } catch (error) {
    return { path, status: 0, ok: false, body: null, text: '', error: error.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!base) {
    console.error(JSON.stringify({ trial: 'human', decision: 'VERIFICATION_FAILED', reason: 'EASY_PUBLIC_URL_REQUIRED' }));
    process.exit(2);
  }

  const [
    gateway,
    integration,
    creativeHealth,
    creativeProvider,
    creativeSelfTest,
    customerHealth,
    revenueHealth,
    runtimeIdentity
  ] = await Promise.all([
    get('/api/gateway/status'),
    get('/integration'),
    get('/api/creative-job/health'),
    get('/api/creative/provider'),
    get('/api/creative/self-test'),
    get('/api/customer/health'),
    get('/api/revenue/health'),
    get('/api/gateway/provenance')
  ]);

  const result = evaluateHumanTrialReadiness({
    gateway,
    integration,
    creativeHealth,
    creativeProvider,
    creativeSelfTest,
    customerHealth,
    revenueHealth,
    runtimeIdentity: runtimeIdentity.body,
    humanTrialAuthorized: String(process.env.EASY_HUMAN_TRIAL_AUTHORIZED || '').toLowerCase() === 'true'
  });

  console.log(JSON.stringify({
    trial: 'human',
    runtimeUrl: base,
    checkedAt: new Date().toISOString(),
    ...result
  }, null, 2));
  if (result.decision !== 'HUMAN_READY') process.exit(1);
}
