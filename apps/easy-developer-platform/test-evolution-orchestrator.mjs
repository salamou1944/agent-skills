import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

const here = new URL('.', import.meta.url);
const orchestrator = new URL('./evolution-orchestrator.mjs', here);

function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    p.stdout.on('data', (d) => { stdout += d; });
    p.stderr.on('data', (d) => { stderr += d; });
    p.on('close', (code) => resolve({ code, stdout, stderr }));
    p.on('error', (error) => resolve({ code: null, stdout, stderr: String(error) }));
  });
}

async function git(cwd, ...args) {
  const r = await run('git', args, cwd);
  assert.equal(r.code, 0, \`git \${args.join(' ')} failed: \${r.stderr}\`);
  return r.stdout.trim();
}

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'evolution-orchestrator-test-'));
  await git(dir, 'init');
  await git(dir, 'config', 'user.email', 'evolution-test@example.invalid');
  await git(dir, 'config', 'user.name', 'Evolution Test');
  await writeFile(join(dir, 'fixture.txt'), 'baseline\n');
  await git(dir, 'add', 'fixture.txt');
  const baseline = await git(dir, 'commit', '-m', 'fixture baseline');
  return { dir, baseline };
}

async function runManifest(manifest, dir) {
  const manifestPath = join(dir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify({ ...manifest, workspace: dir }));
  return run(process.execPath, [orchestrator.pathname, manifestPath], dir);
}

test('promotes exactly one surviving mutation and emits evidence', async () => {
  const { dir, baseline } = await fixture();
  try {
    const output = join(dir, 'evidence.json');
    const r = await runManifest({
      experiment_id: 'fixture-single-survivor',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'winner', changes: [{ path: 'fixture.txt', content: 'winner\n' }] },
        { id: 'loser', changes: [{ path: 'fixture.txt', content: 'loser\n' }] }
      ],
      tests: [{
        name: 'winner-content',
        cmd: process.execPath,
        args: ['-e', "process.exit(require('node:fs').readFileSync('fixture.txt','utf8') === 'winner\\n' ? 0 : 1)"]
      }],
      attacks: [{ name: 'diff-check', cmd: 'git', args: ['diff', '--check'] }],
      output
    }, dir);
    assert.equal(r.code, 0, r.stderr);
    const evidence = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(evidence.status, 'ELIGIBLE_FOR_PROMOTION');
    assert.equal(evidence.survivor, 'winner');
    assert.equal(evidence.candidate_count, 2);
    assert.match(evidence.evidence_hash, /^[a-f0-9]{64}$/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects zero survivors', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-zero-survivor',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'a', changes: [{ path: 'fixture.txt', content: 'a\n' }] },
        { id: 'b', changes: [{ path: 'fixture.txt', content: 'b\n' }] }
      ],
      tests: [{ name: 'always-fail', cmd: process.execPath, args: ['-e', 'process.exit(1)'] }]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /promotion_requires_exactly_one_survivor/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects multiple survivors', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-multi-survivor',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'a', changes: [{ path: 'fixture.txt', content: 'a\n' }] },
        { id: 'b', changes: [{ path: 'fixture.txt', content: 'b\n' }] }
      ],
      tests: [{ name: 'always-pass', cmd: process.execPath, args: ['-e', 'process.exit(0)'] }]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /promotion_requires_exactly_one_survivor/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects unsafe candidate paths', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-path-attack',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'unsafe', changes: [{ path: '../escape.txt', content: 'nope' }] },
        { id: 'also-unsafe', changes: [{ path: '../../escape.txt', content: 'nope' }] }
      ],
      tests: [{ name: 'always-pass', cmd: process.execPath, args: ['-e', 'process.exit(0)'] }]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /promotion_requires_exactly_one_survivor/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects protected workflow mutations', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-workflow-attack',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'workflow', changes: [{ path: '.github/workflows/pwn.yml', content: 'name: pwn\n' }] },
        { id: 'also-workflow', changes: [{ path: '.github/workflows/other.yml', content: 'name: other\n' }] }
      ],
      tests: [{ name: 'always-pass', cmd: process.execPath, args: ['-e', 'process.exit(0)'] }]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /promotion_requires_exactly_one_survivor/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects a project outside the explicit allowlist', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-project-boundary',
      project_id: 'UNKNOWN-PROJECT',
      baseline_revision: baseline,
      candidates: [
        { id: 'a', changes: [{ path: 'fixture.txt', content: 'a\n' }] },
        { id: 'b', changes: [{ path: 'fixture.txt', content: 'b\n' }] }
      ]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /project_id_not_allowlisted/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});


test('rejects duplicate candidate IDs before sandbox execution', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-duplicate-ids',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: baseline,
      candidates: [
        { id: 'same', changes: [{ path: 'fixture.txt', content: 'a\n' }] },
        { id: 'same', changes: [{ path: 'fixture.txt', content: 'b\n' }] }
      ]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /candidate_ids_must_be_unique/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects a manifest whose baseline revision does not match the workspace', async () => {
  const { dir, baseline } = await fixture();
  try {
    const r = await runManifest({
      experiment_id: 'fixture-baseline-mismatch',
      project_id: 'EVOLUTION-LAB',
      baseline_revision: '0'.repeat(40),
      candidates: [
        { id: 'a', changes: [{ path: 'fixture.txt', content: 'a\n' }] },
        { id: 'b', changes: [{ path: 'fixture.txt', content: 'b\n' }] }
      ]
    }, dir);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /baseline_revision_mismatch/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
