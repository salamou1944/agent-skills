import { spawn } from 'node:child_process';

const publicPort = Number(process.env.PORT || 8789);
const root = new URL('./', import.meta.url);
const children = [];
let shuttingDown = false;

function start(script, env) {
  const child = spawn(process.execPath, [new URL(script, root).pathname], {
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: false,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(JSON.stringify({ service: script, event: 'exit', code, signal }));
      shutdown(code || 1);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 1000).unref();
}

start('./server.mjs', { PORT: '8790' });
start('./operator-api.mjs', { EASY_OPERATOR_PORT: '8792', EASY_OPERATOR_BIND: '127.0.0.1' });
start('./gateway.mjs', {
  GATEWAY_PORT: String(publicPort),
  EASY_PLATFORM_URL: 'http://127.0.0.1:8790',
  EASY_OPERATOR_URL: 'http://127.0.0.1:8792',
});

async function check(url) {
  try {
    const response = await fetch(url);
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function json(url) {
  try {
    const response = await fetch(url);
    return { ok: response.ok, status: response.status, body: await response.json() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function bootSmoke() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const publicDomain = process.env.EASY_PUBLIC_BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');
  try {
    const platform = await check('http://127.0.0.1:8790/api/health');
    const operator = await check('http://127.0.0.1:8792/api/operator/health');
    const gateway = await check(`http://127.0.0.1:${publicPort}/api/gateway/status`);
    const capabilities = await json('http://127.0.0.1:8792/api/operator/capabilities');
    const taskResponse = await fetch('http://127.0.0.1:8792/api/operator/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        goal: 'Inspect the EASY runtime service safely and verify its workspace without making external changes.',
        project: 'apps/easy-developer-platform',
      }),
    });
    const task = await taskResponse.json();
    const runResponse = await fetch('http://127.0.0.1:8792/api/operator/run-once', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project: 'apps/easy-developer-platform' }),
    });
    const run = await runResponse.json();
    const external = publicDomain ? await json(`${publicDomain}/api/gateway/status`) : { ok: false, error: 'public_domain_not_available' };
    console.log(JSON.stringify({
      smoke: 'end-to-end',
      platformHealth: platform.ok,
      operatorHealth: operator.ok,
      gatewayHealth: gateway.ok,
      publicGateway: external,
      providerReadiness: capabilities.body || capabilities,
      taskAccepted: taskResponse.status === 202,
      taskStatus: task.status,
      operatorRunStatus: run.result?.status || run.status || 'UNKNOWN',
    }));
  } catch (error) {
    console.error(JSON.stringify({ smoke: 'end-to-end', status: 'FAILED', error: error.message }));
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
console.log(JSON.stringify({ service: 'easy-runtime', publicPort, platformPort: 8790, operatorPort: 8792 }));
void bootSmoke();
