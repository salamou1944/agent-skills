import { spawn } from 'node:child_process';
import { loadState, TASKS, selectNext } from './project-queue-orchestrator.mjs';

const stateFile = process.env.ELITE_QUEUE_STATE || '.easy/project-queue-state.json';
const maxCycles = Math.max(1, Number(process.env.ELITE_QUEUE_MAX_CYCLES || process.argv.find(a => a.startsWith('--max-cycles='))?.split('=')[1] || 6));
const phase = process.env.ELITE_QUEUE_PHASE || null;

function runCycle() {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['apps/easy-developer-platform/run-project-queue-cycle.mjs'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', e => resolve({ code: 1, stdout, stderr: e.message }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

function parseResult(stdout) {
  for (const line of stdout.trim().split('\n').reverse()) {
    try { return JSON.parse(line); } catch {}
  }
  return null;
}

const history = [];
for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
  const state = await loadState(stateFile);
  const task = selectNext(state, phase);
  if (!task) {
    console.log(JSON.stringify({ status: 'COMPLETE', phase: phase || 'all', cycles: cycle - 1, history }, null, 2));
    process.exit(0);
  }
  if (task.repo && task.repo !== 'salamou1944/agent-skills') {
    history.push({ cycle, task: task.id, status: 'EXTERNAL_REPO_HANDOFF', repo: task.repo });
    console.log(JSON.stringify({ status: 'EXTERNAL_REPO_HANDOFF', task, cycles: cycle - 1, history }, null, 2));
    process.exit(0);
  }

  const result = await runCycle();
  const parsed = parseResult(result.stdout);
  history.push({ cycle, task: task.id, exitCode: result.code, result: parsed, stderr: result.stderr.slice(-2000) });
  if (parsed?.status === 'BLOCKED' || parsed?.status === 'VERIFIED' || parsed?.status === 'NOOP') continue;
  if (parsed?.status === 'COMPLETE') break;
  console.error(JSON.stringify({ status: 'FAILED', cycle, task, result: parsed, stderr: result.stderr }, null, 2));
  process.exit(1);
}

const finalState = await loadState(stateFile);
const remaining = TASKS.filter(t => (!phase || t.phase === phase) && !['VERIFIED', 'NOOP'].includes(finalState.tasks?.[t.id]?.status));
console.log(JSON.stringify({ status: remaining.length ? 'IN_PROGRESS' : 'COMPLETE', cycles: history.length, remaining: remaining.map(t => t.id), history }, null, 2));
