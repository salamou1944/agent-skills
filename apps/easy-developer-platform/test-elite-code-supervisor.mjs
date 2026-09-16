import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('Elite Code contract contains the full engineering loop', async () => {
  const skill = await read('skills/elite-code-engineer/SKILL.md');
  const lower = skill.toLowerCase();
  for (const term of ['requirements', 'repository archaeology', 'architecture', 'implementation', 'tests', 'adversarial review', 'repair', 'integration verification', 'evidence']) {
    assert.ok(lower.includes(term), `missing Elite Code stage: ${term}`);
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

test('Autonomous coder has a verified no-op, protected paths, provider fallback, and plan execution', async () => {
  const coder = await read('apps/easy-developer-platform/autonomous-coder.mjs');
  assert.match(coder, /VERIFIED_NOOP/);
  assert.match(coder, /\.github\/workflows/);
  assert.match(coder, /FORBIDDEN/);
  assert.match(coder, /diff.*--check/s);
  assert.match(coder, /models\.github\.ai\/inference/);
  assert.match(coder, /githubToken/);
  assert.match(coder, /EASY_OPERATOR_PLAN_FILE/);
});

test('Supervisor workflow has bounded execution, official model recovery, and verification', async () => {
  const workflow = await read('.github/workflows/elite-code-background-supervisor.yml');
  const prompt = await read('.github/prompts/elite-code-fallback.prompt.yml');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /\*\/5 \* \* \* \*/);
  assert.match(workflow, /EASY_OPENAI_API_KEY/);
  assert.match(workflow, /models:\s*read/);
  assert.match(workflow, /actions\/ai-inference@v2\.1\.1/);
  assert.match(workflow, /prompt-file: \.github\/prompts\/elite-code-fallback\.prompt\.yml/);
  assert.match(workflow, /file_input:/);
  assert.match(workflow, /response-file/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /autonomous-coder\.mjs/);
  assert.match(workflow, /node --check apps\/easy-developer-platform\/operator-worker\.mjs/);
  assert.match(workflow, /git diff --check/);
  assert.match(prompt, /responseFormat: json_schema/);
  assert.match(prompt, /elite_code_plan/);
  assert.doesNotMatch(workflow, /npm install -g @github\/copilot/);
});
