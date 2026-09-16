import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ask } from './autonomous-coder.mjs';

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

test('Autonomous coder has a verified no-op, protected paths, optional provider fallback, and plan execution', async () => {
  const coder = await read('apps/easy-developer-platform/autonomous-coder.mjs');
  assert.match(coder, /VERIFIED_NOOP/);
  assert.match(coder, /\.github\/workflows/);
  assert.match(coder, /FORBIDDEN/);
  assert.match(coder, /diff.*--check/s);
  assert.match(coder, /githubEndpoint:env\.EASY_OPERATOR_GITHUB_MODELS_ENDPOINT\|\|''/);
  assert.match(coder, /githubToken/);
  assert.match(coder, /EASY_OPERATOR_PLAN_FILE/);
  assert.match(coder, /gpt-4o-mini/);
  assert.match(coder, /provider_quota_exhausted/);
  assert.match(coder, /relevance\(b,goal\)/);
  assert.match(coder, /ctx \|\|= await context\(root,goal\)/);
});

test('Quota-exhausted 429 immediately falls through to the configured fallback provider', async () => {
  const calls = [];
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint);
    if (calls.length === 1) {
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        clone() { return this; },
        async json() { return { error: { code: 'insufficient_quota' } }; },
      };
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"fallback","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test quota fallback', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    githubToken: 'fallback-test-token',
    githubEndpoint: 'https://fallback.invalid',
    githubModel: 'fallback-model',
    providerRetries: 3,
    fetchImpl,
  });

  assert.equal(result.summary, 'fallback');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://fallback.invalid']);
});

test('Retired primary provider endpoint falls through only to an explicitly configured fallback', async () => {
  const calls = [];
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint);
    if (calls.length === 1) {
      return {
        ok: false,
        status: 410,
        headers: new Headers(),
        clone() { return this; },
        async json() { return { error: { code: 'gone' } }; },
      };
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"410-fallback","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test retired endpoint fallback', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.retired.invalid',
    model: 'retired-model',
    githubToken: 'fallback-test-token',
    githubEndpoint: 'https://fallback.invalid',
    githubModel: 'fallback-model',
    providerRetries: 3,
    fetchImpl,
  });

  assert.equal(result.summary, '410-fallback');
  assert.deepEqual(calls, ['https://primary.retired.invalid', 'https://fallback.invalid']);
});

test('No fallback endpoint means a retired primary fails fast without probing a dead default', async () => {
  const calls = [];
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint);
    return {
      ok: false,
      status: 410,
      headers: new Headers(),
      clone() { return this; },
      async json() { return { error: { code: 'gone' } }; },
    };
  };

  await assert.rejects(() => ask('test no dead fallback', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.retired.invalid',
    model: 'retired-model',
    githubToken: 'github-token-without-endpoint',
    githubEndpoint: '',
    fetchImpl,
  }), /provider_http_410/);
  assert.deepEqual(calls, ['https://primary.retired.invalid']);
});

test('Supervisor workflow has bounded execution, multi-provider recovery, and post-change verification', async () => {
  const workflow = await read('.github/workflows/elite-code-background-supervisor.yml');
  const prompt = await read('.github/prompts/elite-code-fallback.prompt.yml');
  const copilotPrompt = await read('.github/prompts/elite-code-copilot-fallback.txt');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /\*\/5 \* \* \* \*/);
  assert.match(workflow, /EASY_OPENAI_API_KEY/);
  assert.match(workflow, /EASY_OPERATOR_LLM_MODEL:.*gpt-4o-mini/);
  assert.match(workflow, /models:\s*read/);
  assert.match(workflow, /copilot-requests:\s*write/);
  assert.match(workflow, /actions\/ai-inference@v2\.1\.1/);
  assert.match(workflow, /Install Copilot CLI recovery/);
  assert.match(workflow, /copilot -p/);
  assert.match(workflow, /Apply verified Copilot recovery plan/);
  assert.match(workflow, /Run Elite Code contract tests/);
  assert.match(workflow, /Verify repository after autonomous cycle/);
  assert.match(workflow, /git diff --check/);
  assert.match(workflow, /Fail if no verified provider completed/);
  assert.match(prompt, /responseFormat: json_schema/);
  assert.match(prompt, /elite_code_plan/);
  assert.match(copilotPrompt, /Return ONLY one JSON object/);
  assert.match(copilotPrompt, /Never modify \.github\/workflows/);
});
