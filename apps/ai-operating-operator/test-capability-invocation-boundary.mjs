import assert from 'node:assert/strict';
import {validateCapabilityArtifactInvocation} from './executor.mjs';

const registry={adapters:{
  'ai.local.ollama':{status:'ADAPTER_READY',independentVerifier:'ollama-independent-verifier-v1'},
}};

const artifact={
  repo:'mufeedvh/superpowers',
  revision:'289dc1c4ce47cde394dc27e47b8da47fbe0d12e1',
  sha256:'a'.repeat(64),
  content:'# verified skill'
};

const accepted=validateCapabilityArtifactInvocation(
  {adapter:'ai.local.ollama',mode:'prompt',allowedActions:['chat']},
  artifact,
  registry
);
assert.equal(accepted.ok,true);
assert.equal(accepted.invocation.adapter,'ai.local.ollama');
assert.equal(accepted.invocation.mode,'prompt');
assert.equal(accepted.invocation.artifactSha256,artifact.sha256);
assert.equal(accepted.invocation.sourceRevision,artifact.revision);

const unregistered=validateCapabilityArtifactInvocation(
  {adapter:'unknown.adapter',mode:'prompt',allowedActions:['chat']},
  artifact,
  registry
);
assert.equal(unregistered.ok,false);
assert.equal(unregistered.state,'BLOCKED_PERMISSION');

const unsafeMode=validateCapabilityArtifactInvocation(
  {adapter:'ai.local.ollama',mode:'execute-code',allowedActions:['chat']},
  artifact,
  registry
);
assert.equal(unsafeMode.ok,false);
assert.equal(unsafeMode.state,'REVIEW_REQUIRED');

const missingArtifact=validateCapabilityArtifactInvocation(
  {adapter:'ai.local.ollama',mode:'prompt',allowedActions:['chat']},
  {...artifact,content:''},
  registry
);
assert.equal(missingArtifact.ok,false);
assert.equal(missingArtifact.state,'BLOCKED_EXTERNAL_DEPENDENCY');

const missingAuthorization=validateCapabilityArtifactInvocation(
  {adapter:'ai.local.ollama',mode:'prompt',allowedActions:[]},
  artifact,
  registry
);
assert.equal(missingAuthorization.ok,false);
assert.equal(missingAuthorization.state,'BLOCKED_PERMISSION');

console.log(JSON.stringify({
  ok:true,
  invocationBoundary:'PASS',
  registeredAdapterGate:'PASS',
  modeGate:'PASS',
  provenanceGate:'PASS',
  failClosed:'PASS'
}));
