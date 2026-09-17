import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { TASKS, loadState } from './project-queue-orchestrator.mjs';
import { SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

const stateFile = process.env.ELITE_QUEUE_STATE || '.easy/project-queue-state.json';
const output = process.env.BUILD_MONITOR_OUTPUT || '.easy/build-monitor/latest.json';
const now = new Date().toISOString();
const monitoredRepos = ['salamou1944/agent-skills', 'salamou1944/Easy-', 'salamou1944/Salamou-31', 'salamou1944/AI_operating_memory'];

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
  return SOLDIER_SYSTEMS.map((soldier) => {
    const assignments = Object.entries(state.tasks || {}).filter(([, value]) => value?.assignedSoldier === soldier.id);
    assignments.sort((a, b) => String(b[1]?.updatedAt || '').localeCompare(String(a[1]?.updatedAt || '')));
    const [taskId, taskState] = assignments[0] || [null, null];
    return {
      id: soldier.id, name: soldier.name, domain: soldier.domain, contract: soldier.contract,
      assignedTask: taskId, taskState: taskState?.status || 'UNASSIGNED',
      state: taskState?.status === 'VERIFIED' ? 'COMPLETED' : taskState?.status === 'NOOP' ? 'VERIFIED_NOOP' : taskState?.status === 'BLOCKED' ? 'BLOCKED' : taskState?.status === 'FAILED' ? 'FAILED' : 'NO_LIVE_ASSIGNMENT_RECORDED',
      evidenceCount: Array.isArray(taskState?.evidence) ? taskState.evidence.length : 0,
      updatedAt: taskState?.updatedAt || null,
    };
  });
}

async function githubWorkflowActivity(repo) {
  try {
    const headers = { accept: 'application/vnd.github+json', 'user-agent': 'agent-skills-build-monitor' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=5`, { headers });
    if (!response.ok) return { repo, status: 'UNAVAILABLE', httpStatus: response.status };
    const data = await response.json();
    return {
      repo, status: 'OK', runs: (data.workflow_runs || []).map((run) => ({
        id: run.id, name: run.name, status: run.status, conclusion: run.conclusion,
        event: run.event, branch: run.head_branch, sha: run.head_sha,
        createdAt: run.created_at, updatedAt: run.updated_at, url: run.html_url,
      })),
    };
  } catch (error) {
    return { repo, status: 'UNAVAILABLE', error: String(error?.message || error) };
  }
}

const state = await loadState(stateFile);
const mony = projectMetrics(projectTasks('mony'), state);
const easy = projectMetrics(projectTasks('easy'), state);
const all = projectMetrics(TASKS, state);
const history = Array.isArray(state.history) ? state.history : [];
const recentActivity = history.slice(-25).reverse().map((entry) => ({
  at: entry.at, taskId: entry.id, status: entry.status, scope: entry.scope,
  soldierId: entry.soldierId || null, evidenceCount: Array.isArray(entry.evidence) ? entry.evidence.length : 0,
}));
const workflowActivity = await Promise.all(monitoredRepos.map(githubWorkflowActivity));
const report = {
  schema: 'build-monitor-v1', generatedAt: now,
  source: { queueState: stateFile, taskCount: TASKS.length, soldierCount: SOLDIER_SYSTEMS.length },
  overall: all, systems: { mony, easy }, soldiers: soldierReport(state),
  activity: { lastActivityAt: recentActivity[0]?.at || null, recent: recentActivity },
  githubWorkflowActivity: workflowActivity,
  alerts: [
    ...(all.failed > 0 ? ['queue_contains_failed_tasks'] : []),
    ...(all.blocked > 0 ? ['queue_contains_blocked_tasks'] : []),
    ...(all.pending > 0 ? [`${all.pending}_tasks_not_terminal`] : []),
    ...(!history.some((entry) => entry.soldierId) ? ['no_live_soldier_assignment_records_found'] : []),
    ...(workflowActivity.some((entry) => entry.status === 'UNAVAILABLE') ? ['some_github_workflow_activity_unavailable'] : []),
  ],
  rules: {
    completionPercent: 'VERIFIED tasks / total queued tasks',
    terminalPercent: '(VERIFIED + NOOP) / total queued tasks',
    soldierStatusRequiresRecordedAssignment: true,
    noFalseCompletion: true,
    historicalEvidenceDoesNotCountAsCurrentCompletion: true,
  },
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
