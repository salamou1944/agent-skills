export function classifyFailure(error) {
  const message = String(error?.message || error || 'unknown failure');
  if (/timeout|ECONNRESET|temporar|rate.?limit/i.test(message)) return 'transient';
  if (/permission|unauthor|credential|token/i.test(message)) return 'security-or-environment';
  if (/assert|schema|invalid|expected|typeerror|syntax/i.test(message)) return 'implementation';
  return 'unknown';
}

export function deficitFromFailure({ capability, error, evidence = [] }) {
  const kind = classifyFailure(error);
  return {
    id: `AUTO-${Date.now()}`,
    capability,
    severity: kind === 'security-or-environment' ? 'high' : 'medium',
    status: 'open',
    trigger: String(error?.message || error || 'unknown failure').slice(0, 240),
    failureClass: kind,
    evidence,
    nextAction: kind === 'implementation'
      ? 'patch root cause and rerun focused test'
      : kind === 'transient'
        ? 'retry with bounded policy; if persistent, isolate provider'
        : kind === 'security-or-environment'
          ? 'repair permission/credential boundary without bypassing controls'
          : 'inspect failure and create a deterministic reproduction'
  };
}

export function factorySpecFromDeficit(deficit) {
  return {
    id: `gap-${deficit.capability}`,
    capability: deficit.capability,
    description: `Tool required to close capability deficit: ${deficit.trigger}`,
    risk: deficit.severity === 'high' ? 'medium' : 'low',
    permissions: []
  };
}
