    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    secondaryApiKey: 'y',
    secondaryEndpoint: 'https://secondary.invalid',
    secondaryModel: 'secondary-model',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    fetchImpl,
  }), /all_providers_exhausted:primary:provider_quota_exhausted,secondary:provider_quota_exhausted/);
});


test('Elite self-provisions Copilot CLI when the binary is missing', async () => {
  const calls = [];
  const runImpl = async (command, args, workspace, timeout, env) => {
    calls.push({ command, args, workspace, timeout, hasToken: Boolean(env?.COPILOT_GITHUB_TOKEN) });
    if (command === 'copilot') return { ok: false, error: 'spawn copilot ENOENT', stdout: '', stderr: '' };
    assert.equal(command, 'npx');
    assert.deepEqual(args.slice(0, 2), ['--yes', '@github/copilot']);
    return { ok: true, stdout: '{"summary":"copilot-self-provisioned","changes":[]}', stderr: '' };
  };

  const fetchImpl = async () => ({ ok: false, status: 429, headers: new Headers(), clone() { return this; }, async json() { return { error: { code: 'insufficient_quota' } }; } });
  const result = await ask('test copilot self provision', {
    apiKey: 'x',
    endpoint: 'https://primary.invalid',
    model: 'primary-model',
    providerRetries: 1,
    providerTimeoutMs: 1000,
    copilotToken: 'w',
    workspace: '.',
    fetchImpl,
    runImpl,
  });

  assert.equal(result.summary, 'copilot-self-provisioned');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].command, 'copilot');
  assert.equal(calls[1].command, 'npx');
  assert.equal(calls[1].hasToken, true);
});