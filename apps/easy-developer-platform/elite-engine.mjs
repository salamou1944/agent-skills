import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { runEliteTask } from './elite-harness.mjs';
import { ask } from './autonomous-coder.mjs';
import { inspectRepository, discoverTests, scanImports } from './elite-intelligence.mjs';
import { independentReview, parallelChecks } from './elite-reviewer.mjs';
import { analyzePatch } from './elite-patch.mjs';
import { securityReview } from './elite-security.mjs';
import { createMetrics, persistMetric } from './elite-observability.mjs';
import { remember } from './elite-memory.mjs';
import { withIsolatedWorktree } from './elite-worktree.mjs';

const execFileAsync = promisify(execFile);
function trim(value, max = 8000) { return String(value ?? '').slice(0, max); }
async function git(root, args, timeout = 30_000) { try { const { stdout, stderr } = await execFileAsync('git', args, { cwd: root, timeout, maxBuffer: 4_000_000 }); return { ok: true, stdout: trim(stdout), stderr: trim(stderr) }; } catch (error) { return { ok: false, stdout: trim(error.stdout), stderr: trim(error.stderr || error.message) }; } }

async function inspect({ root, goal, maxContextBytes }) {
  const base = await inspectRepository({ root, goal, maxContextBytes });
  const files = (await git(root, ['ls-files'])).stdout.split('\n').filter(Boolean);
  const imports = await scanImports(root, files.filter(p => /\.(mjs|js|cjs)$/.test(p)));
  return { ...base, context: JSON.stringify({ base: JSON.parse(base.context), imports }).slice(0, maxContextBytes) };
}

function makeProvider(env) {
  return async ({ role, goal, context, failedPlan, failure, constraints }) => {
    const prompt = role === 'repair'
      ? `You are Elite repair planner. Goal: ${goal}\nFailure: ${JSON.stringify(failure)}\nFailed plan: ${JSON.stringify(failedPlan)}\nRepository context: ${context}\nConstraints: ${JSON.stringify(constraints)}\nReturn JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}.`
      : `You are Elite planning agent. Goal: ${goal}\nRepository context: ${context}\nConstraints: ${JSON.stringify(constraints)}\nReturn JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}. Use the smallest safe change set.`;
    return ask(prompt, env);
  };
}

function makeIndependentReviewer(env, injectedProvider) {
  return async ({ goal, patch, changes }) => {
    if (injectedProvider) return injectedProvider({ role: 'reviewer', goal, context: JSON.stringify({ patch, changes }), constraints: { independent: true } });
    const prompt = `You are Elite's independent verification reviewer. You did not author the implementation. Review the proposed change for correctness, regression risk, security, minimality, and whether it actually satisfies the goal. Goal: ${goal}\nPatch facts: ${JSON.stringify(patch)}\nChanges: ${JSON.stringify(changes).slice(0, 120000)}\nReturn JSON only: {"approved":true|false,"findings":["..."],"reason":"..."}. Approve only when evidence supports acceptance.`;
    return ask(prompt, env);
  };
}

async function execute({ changes }) { for (const change of changes) { await mkdir(dirname(change.target), { recursive: true }); await writeFile(change.target, change.content, 'utf8'); } return { ok: true, summary: `applied ${changes.length} planned change(s)` }; }

async function test({ root, changes }) {
  const diff = await git(root, ['diff', '--check']);
  if (!diff.ok) return { ok: false, reason: 'git_diff_check_failed', summary: diff.stderr };
  const tests = await discoverTests({ root, changedFiles: changes.map(c => c.path) });
  const executed = [];
  for (const candidate of tests.slice(0, 8)) {
    try { await execFileAsync('npm', ['run', candidate.name, '--if-present'], { cwd: root, timeout: 120_000, maxBuffer: 6_000_000 }); executed.push(candidate.name); }
    catch (error) { return { ok: false, reason: `test_failed:${candidate.name}`, summary: trim(error.stderr || error.stdout || error.message), evidence: { executed, candidates: tests.map(t => t.name) } }; }
  }
  return { ok: true, summary: executed.length ? `executed ${executed.length} relevant test(s)` : 'diff check passed; no relevant test script discovered', evidence: { executed, candidates: tests.map(t => t.name) } };
}

async function review({ root, goal, changes, env, provider }) {
  const local = securityReview({ changes });
  if (!local.ok) return { ok: false, reason: 'security_gate', evidence: local.findings };
  if (!changes.length) return { ok: true, summary: 'no changes require independent review', evidence: { security: local } };
  const independent = await independentReview({ root, goal, changes, reviewer: makeIndependentReviewer(env, provider) });
  return independent.ok ? { ok: true, summary: 'independent review passed', evidence: independent.evidence } : independent;
}

async function verify({ root, changes }) {
  const [diff, patch] = await Promise.all([git(root, ['diff', '--check']), analyzePatch(root)]);
  if (!diff.ok) return { ok: false, reason: 'git_diff_check_failed', evidence: diff.stderr };
  if (!patch.ok) return { ok: false, reason: 'patch_gate', evidence: patch.findings };
  const syntaxChecked = [];
  for (const change of changes) if (/\.(mjs|js|cjs)$/i.test(change.path)) {
    const result = await execFileAsync(process.execPath, ['--check', change.target], { cwd: root, timeout: 30_000 }).catch(e => ({ error: e }));
    if (result.error) return { ok: false, reason: `syntax_failed:${change.path}`, evidence: trim(result.error.stderr || result.error.message) };
    syntaxChecked.push(change.path);
  }
  return { ok: true, evidence: { gitDiffCheck: true, patch, syntaxChecked } };
}

async function runCore(goal, { root, policy, env, journalPath, provider, metrics }) {
  const result = await runEliteTask(goal, { root, policy, journalPath, provider: provider || makeProvider(env), inspect, execute, test, review: args => review({ ...args, env, provider }), verify });
  metrics.finish(result.status); await persistMetric(policy.metricsPath, metrics.metrics);
  if (policy.memoryPath) await remember(policy.memoryPath, { goal, status: result.status, taskId: result.taskId, steps: result.steps, repairs: result.repairs, evidence: result.evidence });
  return result;
}

export async function runEliteEngine(goal, { root = process.cwd(), policy = {}, env = process.env, journalPath, provider, isolate = true } = {}) {
  const metrics = createMetrics();
  const effectivePolicy = { ...policy, metricsPath: policy.metricsPath || join(root, '.elite', 'metrics.jsonl'), memoryPath: policy.memoryPath || join(root, '.elite', 'memory.jsonl') };
  if (!isolate) return runCore(goal, { root, policy: effectivePolicy, env, journalPath, provider, metrics });
  return withIsolatedWorktree(root, `task-${Date.now()}`, async (worktree, { promote }) => {
    const result = await runCore(goal, { root: worktree, policy: effectivePolicy, env, journalPath, provider, metrics });
    if (result.status === 'verified' && result.changedFiles.length) await promote(result.changedFiles);
    return result;
  });
}

export { parallelChecks };

if (import.meta.url === `file://${process.argv[1]}`) {
  const goal = process.argv.slice(2).join(' ').trim();
  if (!goal) { console.error('goal_required'); process.exit(2); }
  runEliteEngine(goal).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(JSON.stringify({ status: 'FAILED', error: error.message, code: error.code || null }, null, 2)); process.exit(1); });
}
