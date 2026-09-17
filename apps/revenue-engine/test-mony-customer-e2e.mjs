import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const port = 18876;
const child = spawn(process.execPath, ['apps/revenue-engine/affiliate-live-bridge.mjs'], { env: { ...process.env, MONY_REVENUE_PORT: String(port), MONY_REVENUE_LEDGER_PATH: '.easy/mony/test-customer-e2e.jsonl', ELEVENLABS_AFFILIATE_LINK: 'https://example.com/verified-affiliate', MONY_PARTNERSTACK_POSTBACK_SECRET: 'test-secret' }, stdio: 'ignore' });
try {
  await new Promise((resolve, reject) => { const started = setTimeout(() => reject(new Error('server_start_timeout')), 5000); const poll = async () => { try { const r = await fetch(`http://127.0.0.1:${port}/api/revenue/health`); if (r.ok) { clearTimeout(started); resolve(); return; } } catch {} setTimeout(poll, 100); }; poll(); });
  const workbench = await fetch(`http://127.0.0.1:${port}/api/revenue/mony/workbench`);
  assert.equal(workbench.status, 200); const html = await workbench.text();
  for (const marker of ['MONY — AI Workbench', 'Product Content', 'Voice Studio', 'Client Offer']) assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const link = await (await fetch(`http://127.0.0.1:${port}/api/revenue/affiliate-link`)).json();
  assert.equal(link.provider, 'mony'); assert.equal(link.trackingUrl, '/api/revenue/mony/workbench'); assert.match(link.partnerTrackingUrl, /^https:\/\//);
  const nonCash = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({event:'reward.created',data:{key:'pending-1',amount:1000,reward_status:'pending'}}) });
  assert.equal((await nonCash.json()).status, 'ignored');
  const cash = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({event:'reward.created',data:{key:'paid-1',amount:1250,reward_status:'paid'}}) });
  assert.equal((await cash.json()).status, 'recorded');
  const ledger = await (await fetch(`http://127.0.0.1:${port}/api/revenue/ledger`)).json();
  assert.equal(ledger.count, 1); assert.equal(ledger.total, 12.5);
  console.log('mony-customer-e2e: passed');
} finally { child.kill('SIGTERM'); }
