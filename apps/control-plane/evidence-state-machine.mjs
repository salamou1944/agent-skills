#!/usr/bin/env node

const MATURITY_STATES = Object.freeze([
  "DISCOVERED",
  "IMPLEMENTED",
  "UNIT_VERIFIED",
  "INTEGRATION_VERIFIED",
  "RUNTIME_VERIFIED",
  "PROVIDER_VERIFIED",
  "E2E_VERIFIED",
  "BUSINESS_FLOW_VERIFIED",
]);

const EVIDENCE_QUALIFIERS = Object.freeze([
  "OBSERVED",
  "PERSISTED",
  "TRACEABLE",
  "REPRODUCIBLE",
  "HARDENED",
]);

const INDEX = new Map(MATURITY_STATES.map((state, index) => [state, index]));
const IDENTITY_FIELDS = Object.freeze([
  "source",
  "commit",
  "environment",
  "deployment",
  "runtime",
]);

const REQUIRED_EVIDENCE_FIELDS = Object.freeze([
  "oldState",
  "action",
  "newEvidence",
  "verifier",
  "timestamp",
  "source",
  "commit",
  "environment",
  "provenance",
  "newState",
]);

function assertKnownMaturity(state) {
  if (!INDEX.has(state)) throw new Error(`unknown_evidence_maturity:${state}`);
}

function assertKnownQualifier(qualifier) {
  if (!EVIDENCE_QUALIFIERS.includes(qualifier)) {
    throw new Error(`unknown_evidence_qualifier:${qualifier}`);
  }
}

function assertNonEmpty(value, name) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(name + "_required");
  }
}

function assertTimestamp(value) {
  assertNonEmpty(value, "timestamp");
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error("timestamp_invalid");
  }
  if (parsed > Date.now()) throw new Error("timestamp_in_future");
}

export function evidenceMaturityStates() {
  return [...MATURITY_STATES];
}

export function evidenceQualifiers() {
  return [...EVIDENCE_QUALIFIERS];
}

// Backward-compatible name: this returns maturity only, never qualifiers.
export function evidenceStates() {
  return evidenceMaturityStates();
}

export function validateEvidenceTransition(record) {
  if (!record || typeof record !== "object") throw new Error("evidence_transition_required");
  for (const field of REQUIRED_EVIDENCE_FIELDS) assertNonEmpty(record[field], field);
  assertTimestamp(record.timestamp);
  assertKnownMaturity(record.oldState);
  assertKnownMaturity(record.newState);

  const oldIndex = INDEX.get(record.oldState);
  const newIndex = INDEX.get(record.newState);
  if (newIndex !== oldIndex + 1) {
    throw new Error(`invalid_evidence_transition:${record.oldState}->${record.newState}`);
  }

  const provenance = record.provenance;
  if (!provenance || typeof provenance !== "object") throw new Error("provenance_required");
  for (const field of ["source", "branch", "commit", "environment"]) {
    assertNonEmpty(provenance[field], `provenance.${field}`);
  }
  if (provenance.source !== record.source) throw new Error("provenance_source_mismatch");
  if (provenance.commit !== record.commit) throw new Error("provenance_commit_mismatch");
  if (provenance.environment !== record.environment) throw new Error("provenance_environment_mismatch");

  if (record.qualifiers !== undefined) {
    if (!Array.isArray(record.qualifiers)) throw new Error("evidence_qualifiers_must_be_array");
    for (const qualifier of record.qualifiers) assertKnownQualifier(qualifier);
  }

  return true;
}

export function transitionEvidence({
  oldState,
  action,
  newEvidence,
  verifier,
  timestamp = new Date().toISOString(),
  source,
  commit,
  environment,
  provenance,
  qualifiers = [],
}) {
  assertKnownMaturity(oldState);
  const nextIndex = INDEX.get(oldState) + 1;
  if (nextIndex >= MATURITY_STATES.length) {
    throw new Error("evidence_maturity_already_maximum");
  }

  const record = {
    oldState,
    action,
    newEvidence,
    verifier,
    timestamp,
    source,
    commit,
    environment,
    provenance,
    qualifiers,
    newState: MATURITY_STATES[nextIndex],
  };

  validateEvidenceTransition(record);
  return Object.freeze(record);
}

export function invalidateEvidenceOnIdentityChange(previous, current) {
  if (!previous || !current) throw new Error("identity_snapshots_required");
  const changedFields = IDENTITY_FIELDS.filter((field) => previous[field] !== current[field]);
  return {
    stale: changedFields.length > 0,
    changedFields,
    reason: changedFields.length ? "EVIDENCE_IDENTITY_CHANGED" : null,
    requiredAction: changedFields.length ? "INVALIDATE_AND_REVALIDATE" : "NO_INVALIDATION",
  };
}

export function assertEvidenceUsable(evidence, currentIdentity) {
  if (!evidence || typeof evidence !== "object") throw new Error("evidence_required");
  if (!currentIdentity || typeof currentIdentity !== "object") throw new Error("current_identity_required");
  const invalidation = invalidateEvidenceOnIdentityChange(evidence, currentIdentity);
  if (invalidation.stale) {
    throw new Error(`STALE_EVIDENCE:${invalidation.changedFields.join(",")}`);
  }
  return true;
}

export function isAtLeast(state, minimum) {
  assertKnownMaturity(state);
  assertKnownMaturity(minimum);
  return INDEX.get(state) >= INDEX.get(minimum);
}
