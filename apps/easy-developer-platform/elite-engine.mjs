import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { runEliteTask } from './elite-harness.mjs';
import { ask } from './autonomous-coder.mjs';
import { inspectRepository, discoverTests, scanImports } from './elite-intelligence.mjs';
import { normalizeSubtasks, topologicalSubtasks } from './elite-planner.mjs';
import { independentReview } from './elite-reviewer.mjs';
import { runParallelReview } from './elite-parallel.mjs';
import { analyzePatch } from './elite-patch.mjs';
import { securityReview } from './elite-security.mjs';
import { createMetrics, persistMetric } from './elite-observability.mjs';
import { remember } from './elite-memory.mjs';
import { withIsolatedWorktree, workspaceStatus } from './elite-worktree.mjs';
import { buildEngineeringDNA, predictImpact, recordAttempt, readAttemptLedger, rejectRepeatedStrategy, createProof, shadowDelta } from './elite-dna.mjs';
import { generateCounterfactuals, chooseCounterfactual, immuneGate, adversarialProbe, appendEvolution, evolutionEvent, projectScope, crossProjectSignal, stopAndExplain, integritySummary } from './elite-unique-intelligence.mjs';

const execFileAsync = promisify(execFile);
function trim(value, max = 8000) { return String(value ?? '').slice(0, max); }
async function git(root, args, timeout = 30_000) { try { const { stdout, stderr } = await execFileAsync('git', args, { cwd: root, timeout, maxBuffer: 4_000_000 }); return { ok: true, stdout: trim(stdout), stderr: trim(stderr) }; } catch (error) { return { ok: false, stdout: trim(error.stdout), stderr: trim(error.stderr || error.message) }; } }

async function inspect({ root, goal, maxContextBytes, decomposer }) {
  const base = await inspectRepository({ root, goal, maxContextBytes });
  const files = (await git(root, ['ls-files'])).stdout.split('\n').filter(Boolean);
  const imports = await scanImports(root, files.filter(p => /\.(mjs|js|cjs)$/.test(p)));
  const dna = await buildEngineeringDNA({ root, files, imports, goal });
  const counterfactuals = generateCounterfactuals({ goal, context: base.context, constraints: {} });
  const counterfactual = chooseCounterfactual({ candidates: counterfactuals, constraints: {} });
  let decomposition = [];
  if (decomposer) {
    try { const raw = await decomposer({ role: 'decomposer', goal, context: base.context, constraints: { maxSubtasks: 16 } }); decomposition = topologicalSubtasks(normalizeSubtasks(raw)); }
    catch (error) { decomposition = [{ id: 'task-1', goal, dependsOn: [], warning: error.message }]; }
  }
  return { ...base, context: JSON.stringify({ base: JSON.parse(base.context), imports, decomposition, engineeringDNA: dna, counterfactuals, selectedCounterfactual: counterfactual }).slice(0, maxContextBytes), dna, counterfactuals, counterfactual };
}

function makeProvider(env) {
  return async ({ role, goal, context, failedPlan, failure, constraints }) => {
    if (role === 'decomposer') {
      const prompt = `You are Elite's task decomposition specialist. Break the goal into the smallest independently verifiable engineering subtasks, with explicit dependencies. Goal: ${goal}\nRepository context: ${context}\nReturn JSON only: {"subtasks":[{"id":"task-1","goal":"...","dependsOn":[]}]}.`;
      return ask(prompt, env);
    }
    const prompt = role === 'repair'
      ? `You are Elite repair planner. Goal: ${goal}\nFailure: ${JSON.stringify(failure)}\nFailed plan: ${JSON.stringify(failedPlan)}\nRepository context: ${context}\nDo not repeat the failed strategy. Produce a materially different repair hypothesis. Constraints: ${JSON.stringify(constraints)}\nReturn JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}.`
      : `You are Elite planning agent. Goal: ${goal}\nRepository context: ${context}\nUse the supplied decomposition and complete its subtasks in dependency order. Constraints: ${JSON.stringify(constraints)}\nReturn JSON only: {"summary":"...","changes":[{"path":"relative/path","content":"full file content"}]}. Use the smallest safe change set.`;
    return ask(prompt, env);
  };
}

function makeReviewer(env, injectedProvider) {
  return async ({ role = 'reviewer', goal, patch, changes }) => {
    if (injectedProvider) return injectedProvider({ role, goal, context: JSON.stringify({ patch, changes }), constraints: { independent: true } });
    const prompt = `You are Elite's independent ${role} reviewer. You did not author the implementation. Review only the proposed change. Goal: ${goal}\nPatch facts: ${JSON.stringify(patch)}\nChanges: ${JSON.stringify(changes).slice(0, 120000)}\nReturn JSON only: {"approved":true|false,"findings":["..."],"reason":"..."}. Approve only when evidence supports acceptance.`;
    return ask(prompt, env);
  };
}

async function execute({ changes, goal }) {
  const attack = adversarialProbe({ goal, changes });
  if (!attack.ok) return { ok: false, reason: 'adversarial_gate', evidence: attack };
  for (const change of changes) { await mkdir(dirname(change.target), { recursive: true }); await writeFile(change.target, change.content, 'utf8'); }
  return { ok: true, summary: `applied ${changes.length} planned change(s)`, evidence: { adversarial: attack } };
}

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

function highRiskChanges(changes) { return changes.filter(c => /(^|\/)(package\.json|package-lock\.json|migrations?|auth|billing)(\/|$)/i.test(c.path)); }

async function review({ root, goal, changes, env, provider, approval }) {
  const local = securityReview({ changes });
  if (!local.ok) return { ok: false, reason: 'security_gate', evidence: local.findings };
  const attack = adversarialProbe({ goal, changes });
  if (!attack.ok) return { ok: false, reason: 'adversarial_gate', evidence: attack };
  const risky = highRiskChanges(changes);
  if (risky.length) {
    if (typeof approval !== 'function') return { ok: false, reason: 'human_approval_required', evidence: risky.map(c => c.path) };
    const approved = await approval({ goal, changes: risky.map(c => c.path) });
    if (approved !== true) return { ok: false, reason: 'human_approval_denied', evidence: risky.map(c => c.path) };
  }
  if (!changes.length) return { ok: true, summary: 'no changes require independent review', evidence: { security: local, adversarial: attack } };
  const patch = await analyzePatch(root);
  if (!patch.ok) return { ok: false, reason: 'patch_gate', evidence: patch.findings };
  const reviewer = makeReviewer(env, provider);
  const specialists = await runParallelReview({ goal, patch, changes, reviewer });
  if (!specialists.ok) return { ok: false, reason: 'parallel_review_rejected', evidence: specialists };
  const independent = await independentReview({ root, goal, changes, reviewer: args => reviewer({ ...args, role: 'final' }) });
  return independent.ok ? { ok: true, summary: 'parallel specialists and independent final review passed', evidence: { specialists, final: independent.evidence, adversarial: attack } } : independent;
}

async function verify({ root, changes, prediction }) {
  const [diff, patch] = await Promise.all([git(root, ['diff', '--check']), analyzePatch(root)]);
  if (!diff.ok) return { ok: false, reason: 'git_diff_check_failed', evidence: diff.stderr };
  if (!patch.ok) return { ok: false, reason: 'patch_gate', evidence: patch.findings };
  const syntaxChecked = [];
  for (const change of changes) if (/\.(mjs|js|cjs)$/i.test(change.path)) {
    const result = await execFileAsync(process.execPath, ['--check', change.target], { cwd: root, timeout: 30_000 }).catch(e => ({ error: e }));
    if (result.error) return { ok: false, reason: `syntax_failed:${change.path}`, evidence: trim(result.error.stderr || result.error.message) };
    syntaxChecked.push(change.path);
  }
  const actual = [...new Set(changes.map(c => c.path))];
  const shadow = prediction ? shadowDelta({ prediction, actualFiles: actual }) : null;
  return { ok: true, evidence: { gitDiffCheck: true, patch, syntaxChecked, shadow } };
}

const WORKSPACE_SCAN_EXTENSIONS = /\\.(mjs|js|cjs|json|yml|yaml|md)$/i;
const WORKSPACE_SCAN_SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|token|password)\\s*[:=]\\s*[\\"'][^\\"']{12,}[\\"']/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/
];

async function scanWorkspaceSecrets(root) {
  const findings = [];
  async function walk(dir) {
    let entries = [];
    try { entries = await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (WORKSPACE_SCAN_EXTENSIONS.test(entry.name)) {
        let body = '';
        try { body = await readFile(path, 'utf8'); } catch { continue; }
        if (WORKSPACE_SCAN_SECRET_PATTERNS.some(pattern => pattern.test(body))) findings.push(path.slice(root.length + 1));
      }
    }
  }
  await walk(root);
  return Object.freeze([...new Set(findings)]);
}

export async function scanWorkspaceSecrets(root) {
  const findings = [];
  async function walk(dir) {
    let entries = [];
    try { entries = await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (WORKSPACE_SCAN_EXTENSIONS.test(entry.name)) {
        let body = '';
        try { body = await readFile(path, 'utf8'); } catch { continue; }
        if (WORKSPACE_SCAN_SECRET_PATTERNS.some(pattern => pattern.test(body))) findings.push(path.slice(root.length + 1));
      }
    }
  }
  await walk(root);
  return Object.freeze([...new Set(findings)]);
}

async function runCore(goal, { root, policy, env, journalPath, provider, metrics }) {
  const workspaceSecrets = await scanWorkspaceSecrets(root);
  if (workspaceSecrets.length) { const error = new Error(`workspace_secret_detected:${workspaceSecrets.join(',')}`); error.code = 'workspace_secret_detected'; throw error; }
  const activeProvider = provider || makeProvider(env);
  const attemptPath = policy.attemptLedgerPath || join(root, '.elite', 'attempts.jsonl');
  const inspectResult = await inspect({ root, goal, maxContextBytes: policy.maxContextBytes || 900_000, decomposer: activeProvider });
  const guardedProvider = async args => {
    const plan = await activeProvider(args);
    if (args.role === 'repair') {
      const ledger = await readAttemptLedger(attemptPath);
      const gate = rejectRepeatedStrategy(ledger, { plan, failureCode: args.failure?.code, failureMessage: args.failure?.message });
      const immune = immuneGate({ knownFailures: ledger, failureCode: args.failure?.code, failureMessage: args.failure?.message, changedFiles: plan?.changes?.map(x => x.path) || [], strategy: plan?.summary });
      if (!gate.ok || !immune.ok) throw Object.assign(new Error('Elite refused to repeat a failed strategy'), { code: gate.reason || immune.reason });
      await recordAttempt(attemptPath, { goal, plan, failureCode: args.failure?.code, failureMessage: args.failure?.message, strategy: plan.summary });
    }
    return plan;
  };
  const prediction = predictImpact({ dna: inspectResult.dna, changedFiles: [] });
  const project = projectScope(policy.project || 'default');
  const counterfactual = inspectResult.counterfactual;
  const result = await runEliteTask(goal, { root, policy, journalPath, provider: guardedProvider, inspect: () => inspectResult, execute, test, review: args => review({ ...args, env, provider, approval: policy.approval }), verify: args => verify({ ...args, prediction }) });
  const proof = createProof({ goal, result, dna: inspectResult.dna, impact: predictImpact({ dna: inspectResult.dna, changedFiles: result.changedFiles }), tests: result.evidence });
  const verification = result.status === 'verified' ? { ok: true } : { ok: false };
  const completion = stopAndExplain({ result, proof, verification });
  const evolution = evolutionEvent({ taskId: result.taskId, goal, status: result.status, changedFiles: result.changedFiles, proofHash: proof.proofHash });
  if (policy.evolutionPath) await appendEvolution(policy.evolutionPath, evolution);
  const crossProject = crossProjectSignal({ project: policy.project || 'default', kind: 'verified_task', value: result.taskId || goal });
  const integrity = integritySummary({ counterfactual, immune: { signature: null }, adversarial: result.evidence?.find?.(x => x?.adversarial)?.adversarial || null, evolution, crossProject });
  result.evidence = [...(result.evidence || []), { engineeringProof: proof }, { eliteIntegrity: integrity, completion, projectScope: project, crossProject }];
  if (!completion.ok) result.status = 'blocked';
  metrics.finish(result.status); await persistMetric(policy.metricsPath, metrics.metrics);
  if (policy.memoryPath) await remember(policy.memoryPath, { goal, status: result.status, taskId: result.taskId, steps: result.steps, repairs: result.repairs, evidence: result.evidence, dnaHash: inspectResult.dna.dnaHash, proofHash: proof.proofHash });
  return result;
}

export async function runEliteEngine(goal, { root = process.cwd(), policy = {}, env = process.env, journalPath, provider, isolate = true } = {}) {
  const metrics = createMetrics();
  const effectivePolicy = { ...policy, metricsPath: policy.metricsPath || join(root, '.elite', 'metrics.jsonl'), memoryPath: policy.memoryPath || join(root, '.elite', 'memory.jsonl') };
  if (!isolate) return runCore(goal, { root, policy: effectivePolicy, env, journalPath, provider, metrics });
  const status = await workspaceStatus(root);
  if (!status.clean) { const error = new Error('workspace_dirty_refusing_isolated_execution'); error.code = 'workspace_dirty'; throw error; }
  return withIsolatedWorktree(root, `task-${Date.now()}`, async (worktree, { promote }) => {
    const result = await runCore(goal, { root: worktree, policy: effectivePolicy, env, journalPath, provider, metrics });
    if (result.status === 'verified' && result.changedFiles.length) await promote(result.changedFiles);
    return result;
  });
}

export { runParallelReview };

if (import.meta.url === `file://${process.argv[1]}`) {
  const goal = process.argv.slice(2).join(' ').trim();
  if (!goal) { console.error('goal_required'); process.exit(2); }
  runEliteEngine(goal).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(JSON.stringify({ status: 'FAILED', error: error.message, code: error.code || null }, null, 2)); process.exit(1); });
}
