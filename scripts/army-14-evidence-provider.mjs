import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export async function collectEvidence({ envelopePath, resultsPath, outputPath, context }) {
  const envelopeBytes = await readFile(envelopePath);
  const resultsBytes = await readFile(resultsPath);
  const envelope = JSON.parse(envelopeBytes.toString('utf8'));
  const results = JSON.parse(resultsBytes.toString('utf8'));

  const binding = {
    runId: context.runId,
    runAttempt: context.runAttempt,
    repository: context.repository,
    ref: context.ref,
    sha: context.sha,
    workflow: context.workflow,
    eventName: context.eventName,
  };

  const errors = [];
  for (const key of ['runId', 'runAttempt', 'repository', 'ref', 'sha', 'workflow']) {
    if (!binding[key]) errors.push(`missing trusted context: ${key}`);
  }
  if (envelope.runId !== binding.runId) errors.push('envelope runId mismatch');
  if (String(envelope.runAttempt) !== String(binding.runAttempt)) errors.push('envelope runAttempt mismatch');
  if (envelope.repository !== binding.repository) errors.push('envelope repository mismatch');
  if (envelope.ref !== binding.ref) errors.push('envelope ref mismatch');
  if (envelope.sha !== binding.sha) errors.push('envelope sha mismatch');
  if (envelope.eventName !== binding.eventName) errors.push('envelope eventName mismatch');

  const checks = Array.isArray(results.checks) ? results.checks : [];
  if (checks.length === 0) errors.push('no task-specific acceptance checks supplied');
  for (const check of checks) {
    if (!check || typeof check.name !== 'string' || check.exitCode !== 0 || check.trusted !== true) {
      errors.push('acceptance check missing trusted successful result');
      break;
    }
  }

  // This harness deliberately cannot mint VERIFIED: workflow identity and artifact
  // attestation must be independently verified by a downstream trusted verifier.
  const bundle = {
    schemaVersion: 1,
    status: 'BLOCKED',
    verified: false,
    reason: errors.length ? errors : ['independent provenance attestation verification is not implemented in this harness'],
    binding,
    envelopeSha256: sha256(envelopeBytes),
    resultsSha256: sha256(resultsBytes),
    checks,
    collectedAt: new Date().toISOString(),
  };
  await writeFile(outputPath, JSON.stringify(bundle, null, 2) + '\n', { flag: 'wx' });
  return bundle;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [envelopePath, resultsPath, outputPath] = process.argv.slice(2);
  if (!envelopePath || !resultsPath || !outputPath) {
    console.error('Usage: node scripts/army-14-evidence-provider.mjs <envelope.json> <results.json> <output.json>');
    process.exitCode = 2;
  } else {
    try {
      const bundle = await collectEvidence({
        envelopePath,
        resultsPath,
        outputPath,
        context: {
          runId: process.env.GITHUB_RUN_ID,
          runAttempt: process.env.GITHUB_RUN_ATTEMPT,
          repository: process.env.GITHUB_REPOSITORY,
          ref: process.env.GITHUB_REF,
          sha: process.env.GITHUB_SHA,
          workflow: process.env.GITHUB_WORKFLOW,
          eventName: process.env.GITHUB_EVENT_NAME,
        },
      });
      console.log(JSON.stringify({ status: bundle.status, verified: bundle.verified, reason: bundle.reason }, null, 2));
      if (bundle.status !== 'VERIFIED') process.exitCode = 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
