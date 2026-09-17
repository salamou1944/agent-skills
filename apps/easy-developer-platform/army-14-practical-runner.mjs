import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const goal = process.env.ARMY_GOAL || process.argv.slice(2).join(' ');
const root = process.env.ARMY_WORKSPACE || process.cwd();
const roleMatch = String(goal).match(/ARMY-14\s+([A-Za-z-]+)\s+soldier/i);
const role = roleMatch?.[1] || 'Unknown';

const plans = {
  Architect: [
    ['elite-engine', 'npm', ['run', 'test:elite:engine']],
    ['elite-planner', 'npm', ['run', 'test:elite:planner']],
  ],
  Builder: [['elite-harness', 'npm', ['run', 'test:elite:harness']]],
  'UI/UX': [['elite-components', 'npm', ['run', 'test:elite:components']]],
  'Backend/API': [['elite-components', 'npm', ['run', 'test:elite:components']], ['provider-resilience', 'npm', ['run', 'test:elite:provider-resilience']]],
  Database: [['elite-components', 'npm', ['run', 'test:elite:components']]],
  Security: [['provider-resilience', 'npm', ['run', 'test:elite:provider-resilience']], ['syntax-gate', 'node', ['--check', 'apps/easy-developer-platform/autonomous-coder.mjs']]],
  Integration: [['provider-resilience', 'npm', ['run', 'test:elite:provider-resilience']]],
  'AI-Agent': [['elite-supervisor', 'npm', ['run', 'test:elite']], ['elite-harness', 'npm', ['run', 'test:elite:harness']]],
  'Test-QA': [['soldier-contracts', 'npm', ['run', 'test:elite:soldiers']], ['elite-harness', 'npm', ['run', 'test:elite:harness']]],
  'Browser-E2E': [['gateway-smoke', 'curl', ['-fsS', 'https://easy-platform-runtime-v3-production.up.railway.app/api/gateway/status']],
  'Debug-Repair': [['elite-supervisor', 'npm', ['run', 'test:elite']], ['provider-resilience', 'npm', ['run', 'test:elite:provider-resilience']]],
  'Deployment-Ops': [['gateway-smoke', 'curl', ['-fsS', 'https://easy-platform-runtime-v3-production.up.railway.app/api/gateway/status']], ['deployment-recovery', 'npm', ['run', 'test:elite:deployment-recovery']]],
  'Product-MVP': [['elite-components', 'npm', ['run', 'test:elite:components']], ['elite-dna', 'npm', ['run', 'test:elite:dna']]],
  'Research-Capability': [['elite-unique', 'npm', ['run', 'test:elite:unique']], ['project-queue', 'npm', ['run', 'test:elite:queue']]],
};

const expectedProfiles = [
  '01-architect-soldier.agent.md','02-builder-soldier.agent.md','03-ui-ux-soldier.agent.md','04-backend-api-soldier.agent.md',
  '05-database-soldier.agent.md','06-security-soldier.agent.md','07-integration-soldier.agent.md','08-ai-agent-soldier.agent.md',
  '09-test-qa-soldier.agent.md','10-browser-e2e-soldier.agent.md','11-debug-repair-soldier.agent.md','12-deployment-ops-soldier.agent.md',
  '13-product-mvp-soldier.agent.md','14-research-capability-soldier.agent.md'
];

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => stdout += d);
    child.stderr.on('data', (d) => stderr += d);
    child.on('error', (error) => resolve({ ok: false, code: null, stdout, stderr: String(error) }));
    child.on('close', (code) => resolve({ ok: code === 0, code, stdout, stderr }));
  });
}

const failures = [];
const plan = plans[role];
if (!plan) {
  console.error(JSON.stringify({ ok: false, role, error: 'unknown_soldier_role' }, null, 2));
  process.exit(2);
}

for (const [name, command, args] of plan) {
  const result = await run(command, args);
  console.log(`=== ${role}: ${name} ===`);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (!result.ok) failures.push({ name, code: result.code, stderr: result.stderr.slice(-4000) });
}

for (const profile of expectedProfiles) {
  const path = `${root}/.github/agents/${profile}`;
  try {
    const text = await readFile(path, 'utf8');
    for (const marker of ['## Elite capability contract', '## Elite operating mode', '## Execution loop', '## Quality bar', '## Advanced upgrade']) {
      if (!text.includes(marker)) failures.push({ name: `profile:${profile}`, error: `missing:${marker}` });
    }
  } catch {
    failures.push({ name: `profile:${profile}`, error: 'missing_profile' });
  }
}

const evidence = {
  ok: failures.length === 0,
  role,
  mode: 'deterministic-practical-fallback',
  reason: 'External LLM provider unavailable or quota exhausted; role-specific repository/runtime verification is executed instead of treating provider failure as soldier success.',
  checks: plan.map(([name]) => name),
  rosterVerified: failures.filter((x) => String(x.name).startsWith('profile:')).length === 0,
  failures,
};
console.log(JSON.stringify(evidence, null, 2));
if (failures.length) process.exit(1);
