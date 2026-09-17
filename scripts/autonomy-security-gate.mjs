import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const forbiddenPath = /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/|\.))/i;
const forbiddenWorkflowChange = /(^|\/)\.github\/workflows\//i;
const secretLike = /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|private[_-]?key)\s*[:=]\s*["'][^"']{20,}["']/i;

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.elite', '.elite-code-tools'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out); else out.push(relative(root, p));
  }
  return out;
}

const files = await walk(root);
const failures = [];
for (const file of files) {
  if (forbiddenPath.test(file)) failures.push(`forbidden-sensitive-path:${file}`);
  if (forbiddenWorkflowChange.test(file)) failures.push(`workflow-change-requires-explicit-review:${file}`);
  if (!/\.(mjs|js|cjs|json|yml|yaml|md|ts|tsx)$/i.test(file)) continue;
  const text = await readFile(join(root, file), 'utf8').catch(() => '');
  if (secretLike.test(text)) failures.push(`secret-like-literal:${file}`);
}

console.log(JSON.stringify({
  status: failures.length ? 'FAILED' : 'PASSED',
  filesScanned: files.length,
  failures,
  policy: {
    sensitivePathsBlocked: true,
    workflowChangesRequireReview: true,
    literalSecretDetection: true,
    autonomousLoopMustRemainFinite: true
  }
}, null, 2));
if (failures.length) process.exit(1);
