import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SECRET_RULES = [
  { id: 'secret-api-key', re: /(?:api[_-]?key|access[_-]?token|secret)\s*[:=]\s*["'][^"']{12,}["']/i },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function finding(severity, rule, file, message) {
  return { severity, rule, file, message };
}

function syntaxCheck(file, content) {
  if (!/\.(?:m?js|cjs)$/i.test(file)) return null;
  const tmp = path.join('/tmp', `code-guardian-${crypto.randomUUID()}${path.extname(file)}`);
  fs.writeFileSync(tmp, content, { mode: 0o600 });
  try {
    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) return finding('high', 'syntax-error', file, 'JavaScript syntax validation failed');
    return null;
  } finally { fs.rmSync(tmp, { force: true }); }
}

export function scanFiles(files) {
  const findings = [];
  const checks = [];
  for (const item of files) {
    const file = String(item?.path || '');
    const content = String(item?.content || '');
    if (!file || file.startsWith('/') || file.includes('..')) {
      findings.push(finding('high', 'unsafe-path', file || '<unknown>', 'Rejected unsafe file path'));
      continue;
    }
    checks.push({ check: `scan:${file}`, status: 'passed' });
    for (const rule of SECRET_RULES) {
      if (rule.re.test(content)) findings.push(finding('critical', rule.id, file, 'Potential secret detected; value intentionally redacted'));
    }
    const syntax = syntaxCheck(file, content);
    if (syntax) findings.push(syntax);
  }
  const critical = findings.some((x) => x.severity === 'critical');
  const blocked = critical || findings.some((x) => x.severity === 'high');
  return {
    version: '1.0.0',
    runId: crypto.randomUUID(),
    status: blocked ? 'blocked' : 'guarded',
    failClosed: true,
    checks,
    findings,
    summary: { files: files.length, findings: findings.length, blocked }
  };
}

export function scanPaths(paths, root = process.cwd()) {
  const files = paths.map((p) => ({ path: p, content: fs.readFileSync(path.join(root, p), 'utf8') }));
  return scanFiles(files);
}
