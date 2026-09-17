import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { TASKS, loadState } from './project-queue-orchestrator.mjs';
import { SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

const stateFile = process.env.ELITE_QUEUE_STATE || '.easy/project-queue-state.json';
const output = process.env.BUILD_MONITOR_OUTPUT || '.easy/build-monitor/latest.json';
const now = new Date().toISOString();

function projectTasks(phase) { return TASKS.filter((task) => task.phase === phase); }
function projectMetrics(tasks, state) {
  const statuses = tasks.map((task) => state.tasks?.[task.id]?.status || 'PENDING');
  const verified = statuses.filter((s) => s === 'VERIFIED').length;
  const noop = statuses.filter((s) => s === 'NOOP').length;
  const blocked = statuses.filter((s) => s === 'BLOCKED').length;
  const failed = statuses.filter((s) => s === 'FAILED').length;
  const pending = statuses.filter((s) => s === 'PENDING').length;
  const total = tasks.length || 1;
  return {
    total, verified, noop, blocked, failed, pending,
    completionPercent: Math.round((verified / total) * 10000) / 100,
    terminalPercent: Math.round(((verified + noop) / total) * 10000) / 100,
    status: failed > 0 ? 'FAILED' : blocked > 0 ? 'BLOCKED' : pending > 0 ? 'IN_PROGRESS' : 'COMPLETE',
    taskStates: Object.fromEntries(tasks.map((task) => [task.id, state.tasks?.[task.id]?.status || 'PENDING'])),
  };
}

function soldierReport(state) {
  return SOLDIER_SYSTEMS.map((soldier, index) => {
    const task = TASKS[index] || null;
    const taskState = task ? (state.tasks?.[task.id]?.status || 'PENDING') : 'IDLE';
    return {
      id: soldier.id, name: soldier.name, domain: soldier.domain,
      contract: soldier.contract, assignedTask: task?.id || null,
      taskPhase: task?.phase || null, taskState,
      state: taskState === 'VERIFIED' ? 'COMPLETED' : taskState === 'NOOP' ? 'VERIFIED_NOOP' : taskState === 'BLOCKED' ? 'BLOCKED' : taskState === 'FAILED' ? 'FAILED' : 'READY_OR_WAITING',
      evidenceCount: task ? (state.tasks?.[task.id]?.evidence?.length || 0) : 0,
      updatedAt: task ? (state.tasks?.[task.id]?.updatedAt || null) : null,
    };
  });
}

const state = await loadState(stateFile);
const mony = projectMetrics(projectTasks('mony'), state);
const easy = projectMetrics(projectTasks('easy'), state);
const all = projectMetrics(TASKS, state);
const history = Array.isArray(state.history) ? state.history : [];
const recentActivity = history.slice(-25).reverse().map((entry) => ({
  at: entry.at, taskId: entry.id, status: entry.status, scope: entry.scope,
  evidenceCount: Array.isArray(entry.evidence) ? entry.evidence.length : 0,
}));
const lastActivityAt = recentActivity[0]?.at || null;
const report = {
  schema: 'build-monitor-v1', generatedAt: now,
  source: { queueState: stateFile, taskCount: TASKS.length, soldierCount: SOLDIER_SYSTEMS.length },
  overall: all, systems: { mony, easy }, soldiers: soldierReport(state),
  activity: { lastActivityAt, recent: recentActivity },
  alerts: [
    ...(all.failed > 0 ? ['queue_contains_failed_tasks'] : []),
    ...(all.blocked > 0 ? ['queue_contains_blocked_tasks'] : []),
    ...(all.pending > 0 ? [`${all.pending}_tasks_not_terminal`] : []),
  ],
  rules: {
    completionPercent: 'VERIFIED tasks / total queued tasks',
    terminalPercent: '(VERIFIED + NOOP) / total queued tasks',
    noFalseCompletion: true,
    historicalEvidenceDoesNotCountAsCurrentCompletion: true,
  },
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
