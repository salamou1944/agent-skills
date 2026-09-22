#!/usr/bin/env node
import { createServer } from 'node:http';
import { runArmy14 } from './army-14-practical-runner.mjs';

const port = Number(process.env.PORT || 3000);
const intervalMs = Math.max(60_000, Number(process.env.ARMY_INTERVAL_MS || 300_000));
const goal = String(process.env.ARMY_GOAL || 'MONY continuous Army-14 background execution').trim();
const startedAt = new Date().toISOString();
const deployedCommit = String(process.env.RAILWAY_GIT_COMMIT_SHA || '').trim() || null;
let lastRun = null;
let running = false;
let failures = 0;
let lastFailure = null;

export function classifyArmy14CycleFailure(value) {
  const error = String(value?.error ?? value?.message ?? value ?? '').toLowerCase();
  if (/repository_verification_failed:syntax_failed|syntax_failed:/.test(error)) {
    return { code: 'SOURCE_VERIFICATION_FAILED', retryable: false };
  }
  if (/\b429\b|rate.?limit|quota|credit_balance_exhausted/.test(error)) {
    return { code: 'EXTERNAL_PROVIDER_RATE_LIMIT', retryable: true };
  }
  return { code: 'UNKNOWN', retryable: true };
}

async function cycle() {
  if (running) return;
  running = true;
  try {
    lastRun = await runArmy14(goal, { runId: `railway-${Date.now()}` });
    failures = 0;
    lastFailure = null;
  } catch (error) {
    failures += 1;
    lastRun = { status: 'FAILED', error: error instanceof Error ? error.message : String(error), failures };
    lastFailure = classifyArmy14CycleFailure(lastRun);
    console.error(JSON.stringify({ event: 'army14-cycle-failed', ...lastRun }));
  } finally {
    running = false;
  }
}

export function buildArmy14Health({ lastRun, lastFailure, startedAt, running, intervalMs, deployedCommit, failures = 0 }) {
  return {
    service: 'army-14-railway-worker',
    status: lastFailure ? 'degraded' : 'running',
    startedAt,
    deployedCommit,
    running,
    intervalMs,
    failures,
    lastRun: lastRun?.status || null,
    failureCode: lastFailure?.code || null,
    retryable: lastFailure?.retryable ?? null,
    sourceDriftDetected: lastFailure?.code === 'SOURCE_VERIFICATION_FAILED',
    providerAccess: 'not-claimed',
    revenue: 'not-claimed',
    sourceIdentity: {
      provider: 'github',
      repository: 'salamou1944/agent-skills',
      branch: 'main',
      deployedCommit,
    },
  };
}

const server = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const healthStatus = lastFailure ? 503 : 200;
    res.writeHead(healthStatus, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(buildArmy14Health({ lastRun, lastFailure, startedAt, running, intervalMs, deployedCommit, failures })));

    return;
  }
  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ event: 'army14-worker-started', port, intervalMs, goal, deployedCommit, agentSource: process.env.ARMY_AGENT_SOURCE || '.github/agents', runtimeSourcePolicy: 'tracked-agent-profiles' }));
  void cycle();
  setInterval(() => void cycle(), intervalMs).unref();
});

function shutdown(signal) {
  console.log(JSON.stringify({ event: 'army14-worker-shutdown', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
