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

const malformed = buildRuntimeProvenance({ RAILWAY_GIT_COMMIT_SHA: 'main' });
assert.equal(malformed.ok, false);
assert.equal(malformed.commitSha, null);

console.log('runtime provenance contract: PASS');
