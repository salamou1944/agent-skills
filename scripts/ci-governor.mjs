import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';

const root = process.cwd();
const workflowsDir = path.join(root, '.github', 'workflows');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(workflowsDir)) fail('Missing .github/workflows directory');

const workflowFiles = fs.existsSync(workflowsDir)
  ? fs.readdirSync(workflowsDir).filter((f) => /\\.ya?ml$/i.test(f)).sort()
  : [];

const workflowNames = new Map();
for (const file of workflowFiles) {
  const full = path.join(workflowsDir, file);
  let doc;
  try {
    doc = parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    fail(`${file}: invalid YAML: ${error.message}`);
    continue;
  }

  if (!doc || typeof doc !== 'object') {
    fail(`${file}: workflow document is empty`);
    continue;
  }
  if (!doc.name || typeof doc.name !== 'string') fail(`${file}: missing workflow name`);
  else if (workflowNames.has(doc.name)) fail(`${file}: duplicate workflow name '${doc.name}' (also ${workflowNames.get(doc.name)})`);
  else workflowNames.set(doc.name, file);

  const on = doc.on ?? doc.true;
  if (!on || typeof on !== 'object') fail(`${file}: missing trigger configuration`);
  else {
    const triggerKeys = Object.keys(on);
    if (!triggerKeys.some((k) => ['push', 'pull_request', 'workflow_dispatch'].includes(k))) {
      warn(`${file}: no push/pull_request/workflow_dispatch trigger; verify this is intentional`);
    }
    if (triggerKeys.includes('schedule') && !triggerKeys.includes('workflow_dispatch')) {
      fail(`${file}: scheduled workflow must also expose workflow_dispatch for deterministic recovery`);
    }
  }

  const jobs = doc.jobs;
  if (!jobs || typeof jobs !== 'object' || !Object.keys(jobs).length) {
    fail(`${file}: no jobs defined`);
    continue;
  }
  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job || typeof job !== 'object') { fail(`${file}: job '${jobId}' is invalid`); continue; }
    if (!job['runs-on'] && !job.uses) fail(`${file}: job '${jobId}' has neither runs-on nor uses`);
    if (job.needs) {
      const needs = Array.isArray(job.needs) ? job.needs : [job.needs];
      for (const need of needs) if (!Object.hasOwn(jobs, need)) fail(`${file}: job '${jobId}' needs unknown job '${need}'`);
    }
    const steps = Array.isArray(job.steps) ? job.steps : [];
    for (const [index, step] of steps.entries()) {
      if (!step || typeof step !== 'object') { fail(`${file}: job '${jobId}' step ${index + 1} is invalid`); continue; }
      if (typeof step.uses === 'string') {
        const ref = step.uses.split('@')[1] ?? '';
        if (!ref) fail(`${file}: job '${jobId}' step ${index + 1} uses an action without a ref`);
        else if (/^[a-f0-9]{40}$/i.test(ref)) continue;
        else warn(`${file}: job '${jobId}' step ${index + 1} action '${step.uses}' is not pinned to a full commit SHA`);
      }
    }
  }
}

// Syntax-check every tracked JavaScript module without executing application code.
const jsFiles = walk(root)
  .filter((p) => p.endsWith('.mjs') || p.endsWith('.js'))
  .filter((p) => !p.includes(`${path.sep}node_modules${path.sep}`));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) fail(`JS syntax failure: ${path.relative(root, file)}\n${(result.stderr || result.stdout || '').trim()}`);
}

const result = {
  schema: 'ci-governor/v1',
  status: errors.length ? 'BLOCKED' : 'PASS',
  workflows: workflowFiles,
  javascriptFilesChecked: jsFiles.length,
  errors,
  warnings,
  invariants: [
    'Every workflow must parse as YAML.',
    'Every job dependency must resolve to a declared job.',
    'Scheduled workflows must have manual recovery.',
    'JavaScript modules must pass node --check.',
    'Unknown or unverified provider success must never be treated as CI success.'
  ]
};

fs.mkdirSync(path.join(root, '.ci'), { recursive: true });
fs.writeFileSync(path.join(root, '.ci', 'governor-report.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
