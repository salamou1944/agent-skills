import { spawnSync } from 'node:child_process';

const [workflow, ref, ...inputPairs] = process.argv.slice(2);
if (!workflow || !ref) {
  console.error('usage: node dispatch.mjs <workflow> <ref> [key=value ...]');
  process.exit(2);
}

const auth = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
if (auth.status !== 0) {
  console.error(JSON.stringify({ dispatch: 'dispatch_unavailable', reason: 'gh_auth_unavailable' }));
  process.exit(3);
}

const args = ['workflow', 'run', workflow, '--ref', ref];
for (const pair of inputPairs) {
  const i = pair.indexOf('=');
  if (i <= 0) {
    console.error(JSON.stringify({ dispatch: 'invalid_input', input: pair }));
    process.exit(2);
  }
  args.push('-f', pair);
}

const run = spawnSync('gh', args, { encoding: 'utf8' });
if (run.status !== 0) {
  console.error(JSON.stringify({ dispatch: 'dispatch_failed', stderr: run.stderr.trim() }));
  process.exit(4);
}

console.log(JSON.stringify({ dispatch: 'dispatched', workflow, ref, stdout: run.stdout.trim() }));
