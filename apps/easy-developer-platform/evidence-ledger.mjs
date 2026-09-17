#!/usr/bin/env node
import crypto from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const EVIDENCE_LEVELS = Object.freeze([
  'configured','reachable','click_observed','signup_observed','conversion_observed','commission_confirmed','payout_confirmed'
]);

function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex'); }

export function evidenceLevel(events = []) {
  let index = -1;
  for (const event of events) {
    const next = EVIDENCE_LEVELS.indexOf(event?.level);
    if (next > index) index = next;
  }
  return index < 0 ? 'unconfigured' : EVIDENCE_LEVELS[index];
}

export function createEvidenceEvent({ subject, level, source, providerEventId = null, observedAt = new Date().toISOString(), amount = null, currency = null, status = 'observed', details = {} }) {
  if (!subject || !EVIDENCE_LEVELS.includes(level) || !source) throw new Error('invalid_evidence_event');
  const event = { version: 1, subject, level, source, providerEventId, observedAt, amount, currency, status, details };
  return { ...event, evidenceHash: hash(event) };
}

export async function appendEvidence(event, file = process.env.ELITE_EVIDENCE_FILE || '.elite/evidence-ledger.jsonl') {
  const target = resolve(file);
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  await appendFile(target, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
  return event;
}

export function assertEvidenceForClaim(events, requiredLevel) {
  if (!EVIDENCE_LEVELS.includes(requiredLevel)) throw new Error('invalid_required_evidence_level');
  const actual = evidenceLevel(events);
  if (EVIDENCE_LEVELS.indexOf(actual) < EVIDENCE_LEVELS.indexOf(requiredLevel)) throw new Error(`insufficient_evidence:${actual}<${requiredLevel}`);
  return { ok: true, actual, required: requiredLevel };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.EVIDENCE_JSON || process.argv.slice(2).join(' ').trim();
  try {
    const events = raw ? JSON.parse(raw) : [];
    process.stdout.write(`${JSON.stringify({ level: evidenceLevel(events) })}\n`);
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAILED', error: error.message }));
    process.exitCode = 1;
  }
}
