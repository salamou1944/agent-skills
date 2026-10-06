export const SOAT_EVIDENCE_SCHEMA = 'soat-execution-evidence/v1';
export const REQUIRED_SOAT_GATES = Object.freeze([
  'health',
  'authentication',
  'provider_resolved',
  'api_factory_probe',
  'real_chat_completion',
  'official_smoke_suite',
]);

export function validateSoatExecutionEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return { ok:false, reason:'soat_evidence_invalid' };
  }
  if (evidence.schema !== SOAT_EVIDENCE_SCHEMA) {
    return { ok:false, reason:'soat_evidence_schema_invalid' };
  }
  if (evidence.verified !== true) {
    return { ok:false, reason:'soat_evidence_not_verified' };
  }
  const missing = REQUIRED_SOAT_GATES.filter(gate => evidence.gates?.[gate] !== true);
  if (missing.length) return { ok:false, reason:'soat_evidence_gate_failed', missing };
  if (!evidence.runId || !evidence.commit || !evidence.soatSha) {
    return { ok:false, reason:'soat_evidence_provenance_missing' };
  }
  return {
    ok:true,
    schema:evidence.schema,
    runId:evidence.runId,
    commit:evidence.commit,
    soatSha:evidence.soatSha,
    evidenceLevel:evidence.evidenceLevel ?? null,
    scope:evidence.scope ?? null,
    productionStatus:evidence.productionStatus ?? 'unknown',
  };
}

export function requireSoatExecutionEvidence(evidence) {
  const result = validateSoatExecutionEvidence(evidence);
  if (!result.ok) {
    const suffix = result.missing?.length ? ':' + result.missing.join(',') : '';
    throw new Error(result.reason + suffix);
  }
  return result;
}
