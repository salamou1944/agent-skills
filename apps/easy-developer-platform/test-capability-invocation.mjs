import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {invokeVerifiedCapability,verifyCapabilityInvocation,validateCapabilityInvocation} from './capability-invocation.mjs';

const content='# Systematic debugging\n\nTrace the root cause before changing code.';
const sha256=crypto.createHash('sha256').update(content,'utf8').digest('hex');
const selection={
  id:'cap-skill',
  repo:'mufeedvh/superpowers',
  revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',
  capabilityType:'skill',
  evidenceLevel:'VERIFIED_FROM_SOURCE',
  license:'MIT',
  invocation:{mode:'skill_prompt',adapterId:'elite.skill-prompt-v1',verifierId:'elite-capability-invocation-v1'}
};
const artifact={repo:selection.repo,revision:selection.revision,file:'skills/systematic-debugging/SKILL.md',sha256,content};

const invoked=invokeVerifiedCapability(selection,artifact);
assert.equal(invoked.ok,true);
assert.equal(invoked.state,'INVOKED');
assert.equal(invoked.promptContext,content);
assert.equal(verifyCapabilityInvocation(invoked).passed,true);

const tampered={...artifact,content:content+'tampered'};
assert.equal(invokeVerifiedCapability(selection,tampered).reason,'capability_invocation_checksum_mismatch');

const unregistered={...selection,invocation:{...selection.invocation,adapterId:'evil.dynamic-exec-v1'}};
assert.equal(validateCapabilityInvocation(unregistered,artifact).reason,'capability_invocation_adapter_not_allowlisted');

const implicit={...selection};
delete implicit.invocation;
assert.equal(validateCapabilityInvocation(implicit,artifact).reason,'capability_invocation_mode_missing');

console.log(JSON.stringify({ok:true,invocation:'PASS',checksumGate:'PASS',provenance:'PASS',allowlist:'PASS',failClosed:'PASS'}));
