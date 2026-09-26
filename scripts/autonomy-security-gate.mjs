import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const forbiddenPath = /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/|\.))/i;
const workflowPath = /(^|\/)\.github\/workflows\//i;
const secretLike = /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|private[_-]?key)\s*[:=]\s*["'][^"']{20,}["']/i;
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const failures = [];
for (const file of changed) {
  if (forbiddenPath.test(file)) failures.push(`forbidden-sensitive-path:${file}`);
  if (workflowPath.test(file)) {
    const workflowText = await readFile(join(root, file), 'utf8').catch(() => '');
    const explicitlySafe = /workflow-review:\s*operator-safe/i.test(workflowText) && /permissions:\s*\n\s*contents:\s*read/i.test(workflowText);
    if (!explicitlySafe) failures.push(`workflow-change-requires-explicit-review:${file}`);
  }
  if (!/\.(mjs|js|cjs|json|yml|yaml|md|ts|tsx)$/i.test(file)) continue;
  const text = await readFile(join(root, file), 'utf8').catch(() => '');
  if (secretLike.test(text)) failures.push(`secret-like-literal:${file}`);
}
console.log(JSON.stringify({status: failures.length ? 'FAILED' : 'PASSED', changedFiles: changed, failures, policy: {sensitivePathsBlocked:true, workflowChangesRequireReview:true, literalSecretDetection:true, finiteAutonomyRequired:true}}, null, 2));
if (failures.length) process.exit(1);
