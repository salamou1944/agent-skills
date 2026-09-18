export const FAULT_MATRIX = Object.freeze([
  { id: 'provider-429', class: 'quota/rate-limit', retryable: true, expected: 'retry-or-fallback' },
  { id: 'provider-timeout', class: 'transient-provider', retryable: true, expected: 'bounded-timeout-and-fallback' },
  { id: 'provider-410', class: 'dead-endpoint', retryable: false, expected: 'explicit-fallback-or-block' },
  { id: 'malformed-provider-output', class: 'invalid-output', retryable: false, expected: 'fail-closed' },
  { id: 'test-regression', class: 'verification', retryable: false, expected: 'repair-or-block' },
  { id: 'workspace-drift', class: 'repository-conflict', retryable: false, expected: 'reconcile-before-continue' },
  { id: 'permission-denial', class: 'policy', retryable: false, expected: 'block-and-record' },
  { id: 'missing-dependency', class: 'dependency', retryable: false, expected: 'diagnose-and-block' }
]);

export function expectedFaultAction(id) {
  const fault = FAULT_MATRIX.find(item => item.id === id);
  if (!fault) throw new Error('unknown_fault:' + id);
  return fault.expected;
}
