import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

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

async function operatorPost(path, body) {
  const response = await fetch(`http://127.0.0.1:8792${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function bootSmoke() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const publicDomain = process.env.EASY_PUBLIC_BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');
  const workspace = process.env.EASY_OPERATOR_WORKSPACE || '/app';
  const probe = join(workspace, '.easy', 'e2e-guardian-probe.mjs');
  try {
    const platform = await check('http://127.0.0.1:8790/api/health');
    const operator = await check('http://127.0.0.1:8792/api/operator/health');
    const gateway = await check(`http://127.0.0.1:${publicPort}/api/gateway/status`);
    const capabilities = await json('http://127.0.0.1:8792/api/operator/capabilities');

    const taskResponse = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the EASY runtime service safely and verify its workspace without making external changes.',
      project: 'apps/easy-developer-platform',
    });
    const runResponse = await operatorPost('/api/operator/run-once', { project: 'apps/easy-developer-platform' });
    const safeStatus = runResponse.body?.result?.status || runResponse.body?.status || 'UNKNOWN';

    await mkdir(join(workspace, '.easy'), { recursive: true });
    const secretParts = ['FAKE', 'E2E', 'GUARDIAN', 'SECRET'];
    const fakeSecret = secretParts.join('_');
    const probeContent = 'const apiKey = ' + JSON.stringify(fakeSecret) + ';\n';
    await writeFile(probe, probeContent, 'utf8');
    const guardianTask = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the EASY runtime workspace and verify that Guardian blocks embedded secrets.',
      project: 'apps/easy-developer-platform',
    });
    const guardianRun = await operatorPost('/api/operator/run-once', { project: 'apps/easy-developer-platform' });
    const guardianStatus = guardianRun.body?.result?.status || guardianRun.body?.status || 'UNKNOWN';

    await rm(probe, { force: true });
    const recoveryTask = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the EASY runtime service safely and verify its workspace without making external changes.',
      project: 'apps/easy-developer-platform',
    });
    const recoveryRun = await operatorPost('/api/operator/run-once', { project: 'apps/easy-developer-platform' });
    const recoveryStatus = recoveryRun.body?.result?.status || recoveryRun.body?.status || 'UNKNOWN';

    const external = publicDomain ? await json(`${publicDomain}/api/gateway/status`) : { ok: false, error: 'public_domain_not_available' };
    const overall = platform.ok && operator.ok && gateway.ok && taskResponse.status === 202 && safeStatus === 'VERIFIED' && guardianTask.status === 202 && guardianStatus === 'BLOCKED' && recoveryTask.status === 202 && recoveryStatus === 'VERIFIED';
    console.log(JSON.stringify({
      smoke: 'end-to-end',
      platformHealth: platform.ok,
      operatorHealth: operator.ok,
      gatewayHealth: gateway.ok,
      publicGateway: external,
      providerReadiness: capabilities.body || capabilities,
      safeExecution: { accepted: taskResponse.status === 202, taskId: taskResponse.body?.id || null, status: safeStatus },
      guardian: { accepted: guardianTask.status === 202, taskId: guardianTask.body?.id || null, status: guardianStatus, probeRemoved: true },
      recovery: { accepted: recoveryTask.status === 202, taskId: recoveryTask.body?.id || null, status: recoveryStatus },
      overall: overall ? 'PASS' : 'FAIL',
    }));
  } catch (error) {
    await rm(probe, { force: true }).catch(() => {});
    console.error(JSON.stringify({ smoke: 'end-to-end', status: 'FAILED', error: error.message }));
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
console.log(JSON.stringify({ service: 'easy-runtime', publicPort, platformPort: 8790, operatorPort: 8792 }));
void bootSmoke();
