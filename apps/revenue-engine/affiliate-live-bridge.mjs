import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createServer } from 'node:http';
import { createEngine } from './revenue-engine.mjs';
import { createElevenLabsAffiliateAdapter } from './elevenlabs-affiliate-adapter.mjs';

const port = Number(process.env.MONY_REVENUE_PORT || 8796);
const ledgerPath = process.env.MONY_REVENUE_LEDGER_PATH || '.easy/mony/revenue-ledger.jsonl';
const postbackSecret = String(process.env.MONY_PARTNERSTACK_POSTBACK_SECRET || '').trim();
const engine = createEngine({ mode: 'live', providers: { 'elevenlabs-affiliate': createElevenLabsAffiliateAdapter() } });

async function ensureLedger() { await mkdir(dirname(ledgerPath), { recursive: true }); }
async function appendLedger(record) { await ensureLedger(); await appendFile(ledgerPath, `${JSON.stringify(record)}\n`, 'utf8'); }
async function readLedger() {
  try {
    const raw = await readFile(ledgerPath, 'utf8');
    return raw.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('request_too_large');
  }
  return raw ? JSON.parse(raw) : {};
}
function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}
function authorizedPostback(pathname) {
  return Boolean(postbackSecret) && pathname === `/api/revenue/partnerstack/${encodeURIComponent(postbackSecret)}`;
}
function rewardIsCashEligible(data = {}) {
  const rewardStatus = String(data.reward_status || '').toLowerCase();
  const paymentStatus = String(data.payment_status || '').toLowerCase();
  return rewardStatus === 'paid' || paymentStatus === 'available' || paymentStatus === 'withdrawn';
}
async function handleReward(event) {
  if (!event || !['reward.created', 'reward.updated'].includes(event.event)) return { status: 'ignored', reason: 'unsupported_event' };
  const data = event.data || {};
  if (!rewardIsCashEligible(data)) return { status: 'ignored', reason: 'reward_not_cash_eligible', rewardStatus: data.reward_status || null, paymentStatus: data.payment_status || null };
  const amountCents = Number(data.amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { status: 'rejected', reason: 'invalid_reward_amount' };
  const externalEventId = String(data.key || '').trim();
  if (!externalEventId) return { status: 'rejected', reason: 'missing_reward_key' };
  const existing = (await readLedger()).find((record) => record.externalEventId === externalEventId);
  if (existing) return { status: 'already_recorded', record: existing };
  const recorded = engine.recordRevenue({
    confirmed: true,
    provider: 'elevenlabs-affiliate',
    path: 'affiliate',
    amount: amountCents / 100,
    currency: 'USD',
    externalEventId
  });
  if (recorded.status !== 'recorded') return recorded;
  const record = { ...recorded, rewardStatus: data.reward_status || null, paymentStatus: data.payment_status || null, source: data.source || null, partnershipKey: data.partnership_key || null, companyKey: data.company?.key || null };
  await appendLedger(record);
  return record;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/revenue/health') {
      const adapter = createElevenLabsAffiliateAdapter();
      const affiliate = await adapter.healthCheck();
      return json(res, 200, { ok: true, mode: 'live', affiliate, postbackConfigured: Boolean(postbackSecret), ledgerPath, rule: 'Only PartnerStack reward events that are cash-eligible are recorded as revenue.' });
    }
    if (req.method === 'GET' && url.pathname === '/api/revenue/affiliate-link') {
      const adapter = createElevenLabsAffiliateAdapter();
      const health = await adapter.healthCheck();
      if (!health.ok) return json(res, 503, { error: 'affiliate_unavailable' });
      const result = await adapter.execute({ action: 'tracking_url' });
      return json(res, 200, { provider: result.provider, trackingUrl: result.trackingUrl, disclosureRequired: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/revenue/ledger') {
      const records = await readLedger();
      const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return json(res, 200, { count: records.length, total, currency: 'USD', records });
    }
    if (req.method === 'POST' && authorizedPostback(url.pathname)) {
      const event = await body(req);
      const result = await handleReward(event);
      return json(res, result.status === 'recorded' ? 201 : result.status === 'rejected' ? 422 : 200, result);
    }
    return json(res, 404, { error: 'not_found' });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
});

await ensureLedger();
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ service: 'mony-affiliate-live-bridge', port, live: true, partnerstackPostback: Boolean(postbackSecret) }));
