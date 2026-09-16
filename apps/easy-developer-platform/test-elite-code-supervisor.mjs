import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('Elite Code contract contains the full engineering loop', async () => {
  const skill = await read('skills/elite-code-engineer/SKILL.md');
  for (const term of ['requirements', 'repository archaeology', 'architecture', 'implementation', 'tests', 'adversarial review', 'repair', 'integration verification', 'evidence']) {
    assert.match(skill, new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'));
  }
  assert.match(skill, /Definition of done/i);
  assert.match(skill, /Evidence-backed completion/i);
});

test('Supervisor contract is a control loop with completion and evidence gates', async () => {
  const skill = await read('skills/code-progress-supervisor/SKILL.md');
  assert.match(skill, /inspect state -> measure progress -> detect failure -> diagnose -> repair -> validate -> record evidence -> continue/i);
  assert.match(skill, /stuck-state detection/i);
  assert.match(skill, /completion gate/i);
  assert.match(skill, /machine-readable record/i);
});

test('Autonomous coder has a verified no-op and protected paths', async () => {
  const coder = await read('apps/easy-developer-platform/autonomous-coder.mjs');
  assert.match(coder, /VERIFIED_NOOP/);
  assert.match(coder, /\.github\/workflows/);
  assert.match(coder, /FORBIDDEN/);
  assert.match(coder, /git diff.*--check/);
});

test('Supervisor workflow has bounded background execution and verification', async () => {
  const workflow = await read('.github/workflows/elite-code-background-supervisor.yml');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /\*\/5 \* \* \* \*/);
  assert.match(workflow, /EASY_OPENAI_API_KEY/);
  assert.match(workflow, /autonomous-coder\.mjs/);
  assert.match(workflow, /node --check apps\/easy-developer-platform\/operator-worker\.mjs/);
  assert.match(workflow, /git diff --check/);
  assert.doesNotMatch(workflow, /npm install -g @github\/copilot/);
});
