#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const STATE_VERSION = 1;
const DEFAULT_FILE = process.env.ELITE_CANONICAL_STATE_FILE || '.elite/canonical-state.json';

function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex'); }

export function normalizeState(input = {}) {
  const state = {
    version: STATE_VERSION,
    project: String(input.project || 'unknown'),
    state: String(input.state || 'active'),
    last_verified_at: input.last_verified_at || null,
    commit_sha: input.commit_sha || null,
    active_goal: input.active_goal || null,
    completed_tasks: Array.isArray(input.completed_tasks) ? input.completed_tasks : [],
    failed_tasks: Array.isArray(input.failed_tasks) ? input.failed_tasks : [],
    known_risks: Array.isArray(input.known_risks) ? input.known_risks : [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    next_action: input.next_action || null
  };
  return { ...state, stateHash: hash(state) };
}

export async function readCanonicalState(file = DEFAULT_FILE) {
  const raw = await readFile(resolve(file), 'utf8');
  const state = JSON.parse(raw);
  if (state.version !== STATE_VERSION || state.stateHash !== hash(Object.fromEntries(Object.entries(state).filter(([k]) => k !== 'stateHash')))) throw new Error('canonical_state_integrity_failed');
  return state;
}

export async function writeCanonicalState(input, file = DEFAULT_FILE) {
  const target = resolve(file);
  const state = normalizeState(input);
  await mkdir(dirname(target), { recursive:true, mode:0o700 });
  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(state,null,2)}\n`, { encoding:'utf8', mode:0o600 });
  await rename(temp, target);
  return state;
}
