const SHA1 = /^[0-9a-f]{40}$/i;

export function buildRuntimeProvenance(env = process.env) {
  const rawCommitSha = String(env.RAILWAY_GIT_COMMIT_SHA || '').trim();
  const commitSha = SHA1.test(rawCommitSha) ? rawCommitSha.toLowerCase() : null;
  const deploymentId = String(env.RAILWAY_DEPLOYMENT_ID || '').trim() || null;
  const runtimeIdentity = String(env.RAILWAY_SERVICE_ID || '').trim() || 'easy-platform-gateway';

  return {
    ok: Boolean(commitSha),
    runtimeIdentity,
    deploymentId,
    commitSha,
    source: commitSha ? 'railway-runtime-environment' : 'unverified',
    reason: commitSha ? null : 'railway_commit_sha_unavailable_or_invalid'
  };
}
