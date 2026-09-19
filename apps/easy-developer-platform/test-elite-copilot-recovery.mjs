import assert from 'node:assert/strict';
import test from 'node:test';
import { ask } from './autonomous-coder.mjs';

test('Elite invokes Copilot after every configured provider is exhausted', async () => {
  const events = [];
  const fetchImpl = async () => ({
    ok:false,status:429,headers:new Headers(),
    clone(){return this;},
    async json(){return {error:{code:'insufficient_quota'}};},
  });
  let probeAttempts = 0;
  const runImpl = async (command,args) => {
    events.push({command,args});
    if (command === 'copilot' && args[0] === '--version' && probeAttempts++ === 0) return {ok:false,error:'spawn copilot ENOENT',stderr:'spawn copilot ENOENT'};
    return {ok:true,stdout:'{"summary":"copilot-recovered","changes":[]}',stderr:''};
  };
  const result = await ask('recover task', {
    apiKey:'primary-token', endpoint:'https://primary.invalid', model:'primary',
    providerRetries:1, providerTimeoutMs:1000,
    copilotToken:'copilot-token', fetchImpl, runImpl,
  });
  assert.equal(result.summary,'copilot-recovered');
  assert.ok(events.some((event) => event.command === 'npm' && event.args[0] === 'install' && event.args[1] === '-g' && event.args[2] === '@github/copilot'));
  const copilotCall = events.find((event) => event.command === 'copilot' && event.args[0] === '-s');
  assert.ok(copilotCall);
  assert.deepEqual(copilotCall.args.slice(0,3),['-s','--no-ask-user','-p']);
});

test('Elite fails closed when Copilot is absent', async () => {
  const fetchImpl = async () => ({
    ok:false,status:429,headers:new Headers(),
    clone(){return this;},
    async json(){return {error:{code:'insufficient_quota'}};},
  });
  const runImpl = async () => ({ok:false,error:'spawn copilot ENOENT',stderr:'spawn copilot ENOENT'});
  await assert.rejects(() => ask('recover task', {
    apiKey:'primary-token', endpoint:'https://primary.invalid', model:'primary',
    providerRetries:1, providerTimeoutMs:1000,
    copilotToken:'copilot-token', fetchImpl, runImpl,
  }), /all_providers_exhausted:primary:provider_quota_exhausted,copilot-cli:copilot_cli_unavailable/);
});
