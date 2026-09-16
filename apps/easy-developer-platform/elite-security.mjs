const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/
];
const DANGEROUS = [/\bchild_process\b/, /\bexec\s*\(/, /\bspawn\s*\(/];

export function securityReview({ changes = [] }) {
  const findings = [];
  for (const change of changes) {
    const path = String(change.path || '');
    const body = String(change.content || '');
    if (/^\.github\/workflows\//.test(path)) findings.push({ severity: 'high', code: 'workflow_change', path });
    if (/(^|\/)(\.env|credentials|secrets)(\.|\/|$)/i.test(path)) findings.push({ severity: 'high', code: 'secret_path', path });
    for (const pattern of SECRET_PATTERNS) if (pattern.test(body)) findings.push({ severity: 'critical', code: 'possible_secret', path });
    if (/\.ya?ml$/.test(path) && /pull_request_target|workflow_run/.test(body)) findings.push({ severity: 'high', code: 'privileged_workflow_trigger', path });
  }
  return { ok: findings.length === 0, findings };
}

export function commandReview(commands = []) {
  const findings = commands.filter(c => DANGEROUS.some(p => p.test(String(c)))).map(command => ({ severity: 'high', code: 'dangerous_command', command: String(command).slice(0, 300) }));
  return { ok: findings.length === 0, findings };
}
