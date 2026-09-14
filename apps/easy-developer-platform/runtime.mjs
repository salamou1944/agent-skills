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
start('./creative-service.mjs', { EASY_CREATIVE_PORT: '8793' });
start('./gateway.mjs', {
  GATEWAY_PORT: String(publicPort),
  EASY_PLATFORM_URL: 'http://127.0.0.1:8790',
  EASY_OPERATOR_URL: 'http://127.0.0.1:8792',
  EASY_CREATIVE_URL: 'http://127.0.0.1:8793',
});

async function check(url) {
  try {
    const response = await fetch(url);
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function json(url, options) {
  try {
    const response = await fetch(url, options);
    return { ok: response.ok, status: response.status, body: await response.json() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function text(url) {
  try {
    const response = await fetch(url);
    return { ok: response.ok, status: response.status, body: await response.text() };
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

async function creativeSmoke() {
  const base = `http://127.0.0.1:${8793}`;
  const dna = await json(`${base}/api/creative/product-dna`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      assetId: 'boot-smoke-product',
      asset: { mimeType: 'image/jpeg', fileName: 'product.jpg', width: 1000, height: 1000, bytes: 1000 },
      observations: {
        category: 'test', type: 'test-product', brandName: 'BOOT-SMOKE',
        printedText: ['BOOT-SMOKE'], logo: 'test-logo', color: ['black'], shape: 'test-shape',
        components: ['body'], designDetails: ['test-detail'], material: ['test-material'],
      },
    }),
  });
  if (!dna.ok || dna.status !== 201 || !dna.body?.fingerprint) return { ok: false, stage: 'product-dna', result: dna };
  const same = await json(`${base}/api/creative/integrity`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dna: dna.body, candidate: { immutable: dna.body.immutable } }),
  });
  const changed = await json(`${base}/api/creative/integrity`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dna: dna.body, candidate: { immutable: { ...dna.body.immutable, color: ['red'] } } }),
  });
  const compiled = await json(`${base}/api/creative/compile`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dna: dna.body, request: { direction: 'boot smoke creative' } }),
  });
  const provider = await json(`${base}/api/creative/provider`);
  const ok = same.ok && same.body?.decision === 'PASS' && changed.ok && changed.body?.decision === 'BLOCK' && compiled.ok && compiled.body?.instruction?.output?.generationEnabled === false && provider.ok && provider.body?.status === 'DISABLED';
  return { ok, same: same.body?.decision, changed: changed.body?.decision, compiled: compiled.ok, provider: provider.body?.status };
}

async function bootSmoke() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const publicDomain = process.env.EASY_PUBLIC_BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');
  const workspace = process.env.EASY_OPERATOR_WORKSPACE || '/app';
  const e2eWorkspace = join(workspace, '.easy', 'e2e-runtime');
  const safeFile = join(e2eWorkspace, 'safe.mjs');
  const probe = join(e2eWorkspace, 'guardian-probe.mjs');
  try {
    const platform = await check('http://127.0.0.1:8790/api/health');
    const operator = await check('http://127.0.0.1:8792/api/operator/health');
    const creative = await check('http://127.0.0.1:8793/api/creative/health');
    const gateway = await check(`http://127.0.0.1:${publicPort}/api/gateway/status`);
    const dashboard = await text(`http://127.0.0.1:${publicPort}/integration`);
    const dashboardMarker = dashboard.ok && dashboard.body.includes('EASY Developer Platform');
    const dashboardApis = await Promise.all([
      check(`http://127.0.0.1:${publicPort}/api/platform`),
      check(`http://127.0.0.1:${publicPort}/api/registry`),
      check(`http://127.0.0.1:${publicPort}/api/projects`),
      check(`http://127.0.0.1:${publicPort}/api/agent/tasks`),
      check(`http://127.0.0.1:${publicPort}/api/builds`),
      check(`http://127.0.0.1:${publicPort}/api/runtime`),
      check(`http://127.0.0.1:${publicPort}/api/events`),
      check(`http://127.0.0.1:${publicPort}/api/checks`),
    ]);
    const dashboardApiHealthy = dashboardApis.every(x => x.ok && x.status === 200);
    const capabilities = await json('http://127.0.0.1:8792/api/operator/capabilities');
    const creativeResult = await creativeSmoke();

    await mkdir(e2eWorkspace, { recursive: true });
    await writeFile(safeFile, 'export const e2eSafe = true;\n', 'utf8');
    const project = '.easy/e2e-runtime';

    const taskResponse = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the isolated EASY E2E workspace safely and verify it without making external changes.',
      project,
    });
    const runResponse = await operatorPost('/api/operator/run-once', { project });
    const safeStatus = runResponse.body?.result?.status || runResponse.body?.status || 'UNKNOWN';

    const secretParts = ['FAKE', 'E2E', 'GUARDIAN', 'SECRET'];
    const fakeSecret = secretParts.join('_');
    const probeContent = 'const apiKey = ' + JSON.stringify(fakeSecret) + ';\n';
    await writeFile(probe, probeContent, 'utf8');
    const guardianTask = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the isolated EASY E2E workspace and verify that Guardian blocks embedded secrets.',
      project,
    });
    const guardianRun = await operatorPost('/api/operator/run-once', { project });
    const guardianStatus = guardianRun.body?.result?.status || guardianRun.body?.status || 'UNKNOWN';

    await rm(probe, { force: true });
    const recoveryTask = await operatorPost('/api/operator/tasks', {
      goal: 'Inspect the isolated EASY E2E workspace safely and verify it without making external changes.',
      project,
    });
    const recoveryRun = await operatorPost('/api/operator/run-once', { project });
    const recoveryStatus = recoveryRun.body?.result?.status || recoveryRun.body?.status || 'UNKNOWN';

    const external = publicDomain ? await json(`${publicDomain}/api/gateway/status`) : { ok: false, error: 'public_domain_not_available' };
    const overall = platform.ok && operator.ok && creative.ok && gateway.ok && dashboardMarker && dashboardApiHealthy && creativeResult.ok && taskResponse.status === 202 && safeStatus === 'VERIFIED' && guardianTask.status === 202 && guardianStatus === 'BLOCKED' && recoveryTask.status === 202 && recoveryStatus === 'VERIFIED';
    console.log(JSON.stringify({
      smoke: 'end-to-end',
      platformHealth: platform.ok,
      operatorHealth: operator.ok,
      creativeHealth: creative.ok,
      creativeCore: creativeResult,
      gatewayHealth: gateway.ok,
      dashboard: { ok: dashboard.ok, status: dashboard.status, marker: dashboardMarker, apiHealthy: dashboardApiHealthy, apiStatuses: dashboardApis.map(x => x.status ?? null) },
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
  } finally {
    await rm(e2eWorkspace, { recursive: true, force: true }).catch(() => {});
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
console.log(JSON.stringify({ service: 'easy-runtime', publicPort, platformPort: 8790, operatorPort: 8792, creativePort: 8793 }));
void bootSmoke();
