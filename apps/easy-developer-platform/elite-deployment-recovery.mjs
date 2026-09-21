#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runEliteEngine } from './elite-engine.mjs';

const execFileAsync = promisify(execFile);

function trim(value, max = 20_000) {
  return String(value ?? '').slice(-max);
}

export function parseJsonLines(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
}

export function classifyDeploymentFailure(logText) {
  const text = String(logText ?? '').toLowerCase();
  const rules = [
    ['rate_limit', /(429|too many requests|rate limit|quota|resource exhausted)/],
    ['dependency', /(npm err|eresolve|peer dep|module not found|cannot find package|package-lock)/],
    ['build', /(build failed|failed to build|exit code [1-9]|syntaxerror|typeerror)/],
    ['startup', /(application failed to respond|healthcheck|health check|listen|eaddrinuse|crashed|start command)/],
    ['configuration', /(missing.*(env|variable)|environment variable|invalid.*config|unauthorized|forbidden)/],
    ['network', /(enotfound|econnrefused|etimedout|network|dns)/]
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'unknown';
}

async function railway(args, { env = process.env, cwd = process.cwd(), timeout = 120_000, runner = execFileAsync } = {}) {
  try {
    const result = await runner('railway', args, {
      cwd,
      env,
      timeout,
      maxBuffer: 8_000_000
    });
    return { ok: true, stdout: trim(result.stdout), stderr: trim(result.stderr) };
  } catch (error) {
    return { ok: false, stdout: trim(error.stdout), stderr: trim(error.stderr || error.message), code: error.code || null };
  }
}

export async function collectServiceFailure(service, options = {}) {
  const common = {
    ...(options.project ? { '--project': options.project } : {}),
    ...(options.environment ? { '--environment': options.environment } : {}),
    '--service': service
  };
  const deployments = await railway(['deployment', 'list', '--json', '--limit', '10', ...Object.entries(common).flatMap(([k, v]) => [k, v])], options);
  const rows = parseJsonLines(deployments.stdout);
  const deployment = rows.find(row => /^(FAILED|CRASHED)$/i.test(String(row.status))) || rows[0] || null;
  if (!deployment) return { service, ok: false, reason: 'no_deployment_found', deployments: rows };

  const deploymentId = deployment.id || deployment.deploymentId;
  const build = deploymentId
    ? await railway(['logs', deploymentId, '--build', '--lines', '250', '--json', ...Object.entries(common).flatMap(([k, v]) => [k, v])], options)
    : { ok: false, stdout: '', stderr: 'deployment_id_missing' };
  const deploy = deploymentId
    ? await railway(['logs', deploymentId, '--lines', '250', '--json', ...Object.entries(common).flatMap(([k, v]) => [k, v])], options)
    : { ok: false, stdout: '', stderr: 'deployment_id_missing' };
  const logs = [build.stdout, build.stderr, deploy.stdout, deploy.stderr].filter(Boolean).join('\n');
  return {
    service,
    ok: true,
    deployment,
    deploymentId,
    failureClass: classifyDeploymentFailure(logs),
    buildLogs: trim(build.stdout || build.stderr),
    deployLogs: trim(deploy.stdout || deploy.stderr)
  };
}

export async function recoverDeploymentFailures({
  root = process.cwd(),
  services = ['easy-runtime-current', 'easy-platform-runtime', 'easy-platform-runtime-v2', 'easy-runtime'],
  project = process.env.RAILWAY_PROJECT_ID,
  environment = process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_ENVIRONMENT,
  env = process.env,
  deploy = false,
  runner = execFileAsync,
  engine = runEliteEngine
} = {}) {
  if (!env.RAILWAY_TOKEN) throw new Error('RAILWAY_TOKEN_REQUIRED');
  const findings = [];
  for (const service of services) findings.push(await collectServiceFailure(service, { project, environment, env, runner }));

  const actionable = findings.filter(item => item.ok && item.deployment && /^(FAILED|CRASHED)$/i.test(String(item.deployment.status)));
  if (!actionable.length) return { status: 'no_failed_deployments', findings };

  const evidence = actionable.map(item => ({
    service: item.service,
    deploymentId: item.deploymentId,
    status: item.deployment.status,
    failureClass: item.failureClass,
    buildLogs: item.buildLogs,
    deployLogs: item.deployLogs
  }));
  const goal = [
    'Recover the failed Railway legacy services v1/v2 without masking the root cause.',
    'Inspect the supplied deployment evidence, reproduce the failure locally where possible, make the smallest durable repository fix, and prove it with tests and verification.',
    'Do not merely redeploy or retry a failed deployment. Do not repeat a failed strategy.',
    `Railway evidence: ${JSON.stringify(evidence)}`
  ].join('\n');

  const result = await engine(goal, {
    root,
    isolate: true,
    policy: {
      project: 'legacy-railway-recovery',
      maxRepairs: 5,
      requireVerification: true,
      requireReview: true
    },
    env
  });

  const deployments = [];
  if (deploy && result.status === 'verified' && result.changedFiles?.length) {
    for (const item of actionable) {
      const args = ['up', '--detach', '--service', item.service];
      if (project) args.push('--project', project);
      if (environment) args.push('--environment', environment);
      args.push('--message', `Elite root-cause recovery: ${item.service}`);
      deployments.push({ service: item.service, ...(await railway(args, { env, cwd: root, runner })) });
    }
  }

  return { status: result.status, findings, evidence, elite: result, deployments };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const deploy = process.argv.includes('--deploy');
  recoverDeploymentFailures({ deploy })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error(JSON.stringify({ status: 'FAILED', error: error.message, code: error.code || null }, null, 2));
      process.exit(1);
    });
}
