import assert from 'node:assert/strict';
import { buildRuntimeProvenance } from './runtime-provenance.mjs';

const missing = buildRuntimeProvenance({});
assert.equal(missing.ok, false);
assert.equal(missing.commitSha, null);
assert.equal(missing.reason, 'railway_commit_sha_unavailable_or_invalid');

const validSha = 'a'.repeat(40);
const verified = buildRuntimeProvenance({
  RAILWAY_GIT_COMMIT_SHA: validSha,
  RAILWAY_DEPLOYMENT_ID: 'deployment-123',
  RAILWAY_SERVICE_ID: 'service-123'
});
assert.equal(verified.ok, true);
assert.equal(verified.commitSha, validSha);
assert.equal(verified.deploymentId, 'deployment-123');
assert.equal(verified.runtimeIdentity, 'service-123');
assert.equal(verified.source, 'railway-runtime-environment');

const uppercase = buildRuntimeProvenance({ RAILWAY_GIT_COMMIT_SHA: validSha.toUpperCase() });
assert.equal(uppercase.ok, true);
assert.equal(uppercase.commitSha, validSha, 'valid uppercase SHA should normalize to lowercase');

const padded = buildRuntimeProvenance({ RAILWAY_GIT_COMMIT_SHA: `  ${validSha.toUpperCase()}  ` });
assert.equal(padded.ok, true, 'surrounding whitespace should be trimmed');
assert.equal(padded.commitSha, validSha);

for (const invalidSha of ['main', 'a'.repeat(39), 'a'.repeat(41), 'g'.repeat(40), '']) {
  const malformed = buildRuntimeProvenance({ RAILWAY_GIT_COMMIT_SHA: invalidSha });
  assert.equal(malformed.ok, false, `invalid SHA must fail closed: ${JSON.stringify(invalidSha)}`);
  assert.equal(malformed.commitSha, null);
}

const defaults = buildRuntimeProvenance({ RAILWAY_GIT_COMMIT_SHA: validSha });
assert.equal(defaults.runtimeIdentity, 'easy-platform-gateway');
assert.equal(defaults.deploymentId, null);

console.log('runtime provenance contract: PASS');
