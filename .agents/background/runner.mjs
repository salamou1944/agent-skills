import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const statePath = new URL('./state.json', import.meta.url);
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
state.state = 'RUNNING';
state.attempt = Number(state.attempt || 0) + 1;

function run(command, args) {
  const r = spawnSync(command, args, { encoding: 'utf8', timeout: 120000, shell: false });
  return { ok: r.status === 0, code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const checks = [];
const packageCheck = run('node', ['--version']);
checks.push({ name: 'node', ok: packageCheck.ok, output: packageCheck.stdout.trim() });

const validation = run('node', ['.agents/skills/ci-manual-dispatch/scripts/preflight.mjs', '.github/workflows/easy-developer-platform.yml']);
checks.push({ name: 'ci-preflight', ok: validation.ok, output: (validation.stdout + validation.stderr).trim() });

const failed = checks.filter(x => !x.ok);
state.last_action = 'Run bounded repository background checks';
state.last_result = failed.length ? 'checks_failed' : 'checks_passed';
state.last_evidence = checks;
state.blocker = failed.length ? failed.map(x => `${x.name}: ${x.output}`).join('\n') : null;
state.next_action = failed.length ? 'Diagnose the first failing check' : 'Inspect latest CI and select the highest-value unblocked engineering action';
state.state = failed.length ? 'BLOCKED' : 'VERIFYING';
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

console.log(JSON.stringify({ ...state, checks }, null, 2));
process.exit(failed.length ? 1 : 0);
