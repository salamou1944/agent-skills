#!/usr/bin/env node
const base = String(process.env.EASY_PUBLIC_URL || '').replace(/\/$/, '');
if (!base) { console.error(JSON.stringify({ trial: 'human', decision: 'BLOCKED', reason: 'EASY_PUBLIC_URL_REQUIRED' })); process.exit(2); }
async function get(path) { try { const response = await fetch(base + path, { redirect: 'manual' }); const body = await response.text(); return { path, status: response.status, ok: response.ok, body }; } catch (error) { return { path, status: 0, ok: false, error: error.message }; } }
const gateway = await get('/api/gateway/status');
const integration = await get('/integration');
const creativeHealth = await get('/api/creative-job/health');
const customerHealth = await get('/api/customer/health');
const revenueHealth = await get('/api/revenue/health');
const json = (item) => { try { return JSON.parse(item.body); } catch { return null; } };
const gatewayBody = json(gateway), creativeBody = json(creativeHealth), customerBody = json(customerHealth), revenueBody = json(revenueHealth);
const checks = [
  { name: 'gateway', pass: gateway.status === 200 && gatewayBody?.platformOnline === true && gatewayBody?.operatorOnline === true },
  { name: 'integration', pass: integration.status === 200 && /EASY Developer Platform/.test(integration.body) },
  { name: 'creative-job-health', pass: creativeHealth.status === 200 && Boolean(creativeBody?.status) },
  { name: 'customer-health', pass: customerHealth.status === 200 && customerBody?.persistent === true },
  { name: 'revenue-health', pass: revenueHealth.status === 200 && revenueBody?.ok === true }
];
const decision = checks.every(check => check.pass) ? 'READY' : 'BLOCKED';
const evidence = { trial: 'human', runtimeUrl: base, checkedAt: new Date().toISOString(), checks: checks.map(check => ({ name: check.name, status: check.pass ? 'PASS' : 'FAIL' })), decision, risks: decision === 'READY' ? [] : checks.filter(check => !check.pass).map(check => check.name) };
console.log(JSON.stringify(evidence, null, 2));
if (decision !== 'READY') process.exit(1);
