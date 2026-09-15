import { spawn } from 'node:child_process';

const intervalMs = Math.max(30_000, Number(process.env.EASY_WORKER_INTERVAL_MS || 60_000));
const repo = process.env.EASY_GITHUB_REPO || 'salamou1944/agent-skills';
const railwayProject = process.env.RAILWAY_PROJECT_ID || '';
let busy = false;
let stopping = false;

function log(event, extra = {}) {
  console.log(JSON.stringify({ service: 'easy-background-worker', event, at: new Date().toISOString(), ...extra }));
}

async function runCommand(command, args) {
  return await new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false, env: process.env });
    child.once('exit', (code, signal) => resolve({ code: code ?? 1, signal: signal ?? null }));
    child.once('error', (error) => resolve({ code: 1, signal: null, error: error.message }));
  });
}

async function cycle() {
  if (busy || stopping) return;
  busy = true;
  try {
    log('cycle-start', { repo, railwayProject: Boolean(railwayProject) });
    // Keep the worker conservative: inspect CI/deploy state through the local automation
    // entrypoint when available; never mutate production by itself.
    const result = await runCommand(process.execPath, [new URL('./background-cycle.mjs', import.meta.url).pathname]);
    log('cycle-end', { code: result.code, signal: result.signal, error: result.error || null });
  } catch (error) {
    log('cycle-error', { error: error.message });
  } finally {
    busy = false;
  }
}

async function main() {
  log('started', { intervalMs });
  await cycle();
  const timer = setInterval(cycle, intervalMs);
  const stop = () => {
    stopping = true;
    clearInterval(timer);
    log('stopped');
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

void main();
