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

test('Autonomous coder has a verified no-op, protected paths, optional provider fallback, bounded provider execution, and plan execution', async () => {
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
  assert.match(coder, /providerTimeoutMs/);
  assert.match(coder, /rateLimitWaitMs/);
  assert.match(coder, /retry-after/);
  assert.match(coder, /x-ratelimit-reset/);
  assert.match(coder, /AbortController/);
  assert.match(coder, /relevance\(b,goal\)/);
  assert.match(coder, /ctx \|\|= await context\(root,goal\)/);
  assert.match(coder, /paths\.has/);
  assert.match(coder, /copilotPlan/);
  assert.match(coder, /COPILOT_GITHUB_TOKEN/);
  assert.match(coder, /copilotToken:env\.COPILOT_GITHUB_TOKEN\|\|env\.GITHUB_TOKEN/);
  assert.match(coder, /copilotToken:env\.COPILOT_GITHUB_TOKEN\|\|env\.GITHUB_TOKEN\|\|env\.EASY_GITHUB_TOKEN/);
  assert.match(coder, /copilot_cli_failed/);
});

test('Project queue recovery uses current Copilot CLI fallback and exact failure evidence', async () => {
  const workflow = await read('.github/workflows/elite-project-queue.yml');
  const prompt = await read('.github/prompts/elite-queue-fallback.prompt.yml');
  const copilotPrompt = await read('.github/prompts/elite-queue-copilot-fallback.txt');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /\*\/5 \* \* \* \*/);
  assert.match(workflow, /copilot-requests:\s*write/);
  assert.match(workflow, /Install Copilot CLI recovery/);
  assert.match(workflow, /copilot -s --no-ask-user/);
  assert.match(workflow, /Build independent queue recovery context/);
  assert.match(workflow, /exact failed cycle output/);
  assert.match(workflow, /tee \/tmp\/elite-cycle-result\.txt/);
  assert.match(workflow, /PIPESTATUS\[0\]/);
  assert.match(workflow, /Apply and verify independent recovery plan/);
  assert.match(workflow, /response-file/);
  assert.doesNotMatch(workflow, /actions\/ai-inference@/);
  assert.doesNotMatch(workflow, /models\.github\.ai\/inference/);
  assert.match(prompt, /elite_queue_plan/);
  assert.match(prompt, /HTTP 429/);
  assert.match(prompt, /exhausted quota/);
  assert.match(prompt, /dead endpoints/);
  assert.match(prompt, /Never invent live providers, leads, replies, payments, or revenue/);
  assert.match(copilotPrompt, /Return ONLY one JSON object/);
  assert.match(copilotPrompt, /Never modify \.github\/workflows/);
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
    providerTimeoutMs: 1000,
    fetchImpl,
  });

  assert.equal(result.summary, 'fallback');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://fallback.invalid']);
});

test('Rate-limited 429 honors Retry-After and recovers before invoking fallback', async () => {
  const calls = [];
  const waits = [];
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint);
    if (calls.length < 3) {
      return {
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '7' }),
        clone() { return this; },
        async json() { return { error: { type: 'rate_limit_exceeded' } }; },
      };
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"429-recovered","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test rate limit recovery', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    providerRetries: 3,
    providerTimeoutMs: 1000,
    rateLimitWaitMs: 10000,
    fetchImpl,
    sleepImpl: async (ms) => waits.push(ms),
  });

  assert.equal(result.summary, '429-recovered');
  assert.deepEqual(calls, ['https://primary.invalid', 'https://primary.invalid', 'https://primary.invalid']);
  assert.deepEqual(waits, [7000, 7000]);
});

test('Rate-limited 429 can recover from a reset header expressed as an epoch timestamp', async () => {
  const waits = [];
  let calls = 0;
  const reset = Math.floor((Date.now() + 5000) / 1000);
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return {
        ok: false,
        status: 429,
        headers: new Headers({ 'x-ratelimit-reset-requests': String(reset) }),
        clone() { return this; },
        async json() { return { error: { type: 'rate_limit_exceeded' } }; },
      };
    }
    return { ok: true, async json() { return { choices: [{ message: { content: '{"summary":"reset-recovered","changes":[]}' } }] }; } };
  };

  const result = await ask('test reset recovery', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    providerRetries: 2,
    providerTimeoutMs: 1000,
    rateLimitWaitMs: 10000,
    fetchImpl,
    sleepImpl: async (ms) => waits.push(ms),
  });

  assert.equal(result.summary, 'reset-recovered');
  assert.equal(calls, 2);
  assert.ok(waits[0] >= 0 && waits[0] <= 10000);
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
    providerTimeoutMs: 1000,
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
    providerTimeoutMs: 1000,
    fetchImpl,
  }), /provider_http_410/);
  assert.deepEqual(calls, ['https://primary.retired.invalid']);
});

test('Transient provider failures retry with bounded attempts before surfacing the failure', async () => {
  const calls = [];
  const fetchImpl = async () => {
    calls.push(Date.now());
    return {
      ok: false,
      status: 500,
      headers: new Headers(),
      clone() { return this; },
      async json() { return { error: { code: 'server_error' } }; },
    };
  };
  const sleepImpl = async () => {};

  await assert.rejects(() => ask('test transient retry', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    providerRetries: 3,
    providerTimeoutMs: 1000,
    fetchImpl,
    sleepImpl,
  }), /provider_http_500/);
  assert.equal(calls.length, 3);
});

test('Timeouts are bounded and can recover through an explicit fallback', async () => {
  const calls = [];
  const fetchImpl = async (endpoint, options) => {
    calls.push(endpoint);
    if (calls.length === 1) {
      return await new Promise((resolve, reject) => {
        const onAbort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        if (options.signal.aborted) return onAbort();
        options.signal.addEventListener('abort', onAbort, { once: true });
      });
    }
    return {
      ok: true,
      async json() { return { choices: [{ message: { content: '{"summary":"timeout-recovered","changes":[]}' } }] }; },
    };
  };

  const result = await ask('test timeout fallback', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.timeout.invalid',
    model: 'primary-model',
    githubToken: 'fallback-test-token',
    githubEndpoint: 'https://fallback.invalid',
    githubModel: 'fallback-model',
    providerRetries: 1,
    providerTimeoutMs: 10,
    fetchImpl,
  });

  assert.equal(result.summary, 'timeout-recovered');
  assert.deepEqual(calls, ['https://primary.timeout.invalid', 'https://fallback.invalid']);
});

test('Supervisor workflow has bounded execution, Copilot recovery, and post-change verification', async () => {
  const workflow = await read('.github/workflows/elite-code-background-supervisor.yml');
  const prompt = await read('.github/prompts/elite-code-fallback.prompt.yml');
  const copilotPrompt = await read('.github/prompts/elite-code-copilot-fallback.txt');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /\*\/5 \* \* \* \*/);
  assert.match(workflow, /EASY_OPENAI_API_KEY/);
  assert.match(workflow, /EASY_OPERATOR_LLM_MODEL:.*gpt-4o-mini/);
  assert.match(workflow, /copilot-requests:\s*write/);
  assert.match(workflow, /Install Copilot CLI recovery/);
  assert.match(workflow, /copilot -s --no-ask-user/);
  assert.match(workflow, /Apply verified recovery plan/);
  assert.match(workflow, /Run Elite Code contract tests/);
  assert.match(workflow, /Verify repository after autonomous cycle/);
  assert.match(workflow, /git diff --check/);
  assert.match(workflow, /Fail if no verified provider completed/);
  assert.doesNotMatch(workflow, /actions\/ai-inference@/);
  assert.doesNotMatch(workflow, /models\.github\.ai\/inference/);
  assert.match(prompt, /responseFormat: json_schema/);
  assert.match(prompt, /elite_code_plan/);
  assert.match(copilotPrompt, /Return ONLY one JSON object/);
  assert.match(copilotPrompt, /Never modify \.github\/workflows/);
});


test('Provider exhaustion activates Copilot CLI as the final recovery route', async () => {
  const calls = [];
  const result = await ask('test Copilot recovery', {
    apiKey: 'primary-test-token',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    copilotToken: 'copilot-test-token',
    runImpl: async (command, args) => {
      calls.push({ command, args });
      return { ok: true, stdout: '{"summary":"copilot-recovered","changes":[]}' };
    },
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      headers: new Headers(),
      clone() { return this; },
      async json() { return { error: { code: 'insufficient_quota' } }; },
    }),
  });
  assert.equal(result.summary, 'copilot-recovered');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'copilot');
  assert.ok(calls[0].args.includes('--no-ask-user'));
});
