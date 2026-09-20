import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';

const port = 18876;
const child = spawn(process.execPath, ['apps/revenue-engine/affiliate-live-bridge.mjs'], { env: { ...process.env, MONY_REVENUE_PORT: String(port), MONY_REVENUE_LEDGER_PATH: '.easy/mony/test-customer-e2e.jsonl', ELEVENLABS_AFFILIATE_LINK: 'https://example.com/verified-affiliate', MONY_PARTNERSTACK_POSTBACK_SECRET: 'test-secret' }, stdio: 'ignore' });
try {
  await new Promise((resolve, reject) => { const started = setTimeout(() => reject(new Error('server_start_timeout')), 5000); const poll = async () => { try { const r = await fetch(`http://127.0.0.1:${port}/api/revenue/health`); if (r.ok) { clearTimeout(started); resolve(); return; } } catch {} setTimeout(poll, 100); }; poll(); });
  const workbench = await fetch(`http://127.0.0.1:${port}/api/revenue/mony/workbench`);
  assert.equal(workbench.status, 200); const html = await workbench.text();
  for (const marker of ['MONY — AI Workbench', 'Product Content', 'Voice Studio', 'Client Offer']) assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const link = await (await fetch(`http://127.0.0.1:${port}/api/revenue/affiliate-link`)).json();
  assert.equal(link.provider, 'mony'); assert.match(link.trackingUrl, /^https:\/\//); assert.equal(link.partnerTrackingUrl, link.trackingUrl); assert.equal(link.workbenchUrl, '/api/revenue/mony/workbench');
  const freshOwnerlessLock = '.easy/mony/test-customer-e2e.jsonl.lock';
  await mkdir(freshOwnerlessLock, { recursive: true });
  try {
    const locked = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({event:'reward.created',data:{key:'fresh-lock-1',amount:100,reward_status:'paid'}}) });
    assert.equal(locked.status, 500);
    assert.equal((await locked.json()).error, 'mony_ledger_lock_timeout');
  } finally { await rm(freshOwnerlessLock, { recursive: true, force: true }); }

  const nonCash = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({event:'reward.created',data:{key:'pending-1',amount:1000,reward_status:'pending'}}) });
  assert.equal((await nonCash.json()).status, 'ignored');
  const cash = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({event:'reward.created',data:{key:'paid-1',amount:1250,reward_status:'paid'}}) });
  assert.equal((await cash.json()).status, 'recorded');
  const ledger = await (await fetch(`http://127.0.0.1:${port}/api/revenue/ledger`)).json();
  assert.equal(ledger.count, 1); assert.equal(ledger.total, 12.5);

  const racePayload = JSON.stringify({event:'reward.created',data:{key:'race-1',amount:775,reward_status:'paid',partnership_key:'campaign-a'}});
  const raceResults = await Promise.all([0,1].map(() => fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method:'POST', headers:{'content-type':'application/json'}, body:racePayload }).then(async r => ({status:r.status, body:await r.json()}))));
  assert.deepEqual(raceResults.map(x=>x.body.status).sort(), ['already_recorded','recorded']);
  const afterRace = await (await fetch(`http://127.0.0.1:${port}/api/revenue/ledger`)).json();
  assert.equal(afterRace.count, 2); assert.equal(afterRace.total, 20.25);

  const conflict = await fetch(`http://127.0.0.1:${port}/api/revenue/partnerstack/test-secret`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({event:'reward.updated',data:{key:'race-1',amount:999,reward_status:'paid',partnership_key:'campaign-a'}}) });
  assert.equal(conflict.status, 422); assert.equal((await conflict.json()).reason, 'reward_event_conflict');
  console.log('mony-customer-e2e: passed');
} finally { child.kill('SIGTERM'); }
