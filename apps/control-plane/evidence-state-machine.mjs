#!/usr/bin/env node

const STATES = Object.freeze([
  "DISCOVERED",
  "IMPLEMENTED",
  "UNIT_VERIFIED",
  "INTEGRATION_VERIFIED",
  "RUNTIME_VERIFIED",
  "PROVIDER_VERIFIED",
  "E2E_VERIFIED",
  "BUSINESS_FLOW_VERIFIED",
  "OBSERVED",
  "PERSISTED",
  "HARDENED",
  "HUMAN_READY",
]);

const INDEX = new Map(STATES.map((state, index) => [state, index]));
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

function assertKnownState(state) {
  if (!INDEX.has(state)) throw new Error(`unknown_evidence_state:${state}`);
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
}

export function evidenceStates() {
  return [...STATES];
}

export function validateEvidenceTransition(record) {
  if (!record || typeof record !== "object") throw new Error("evidence_transition_required");
  for (const field of REQUIRED_EVIDENCE_FIELDS) assertNonEmpty(record[field], field);
  assertTimestamp(record.timestamp);
  assertKnownState(record.oldState);
  assertKnownState(record.newState);

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
}) {
  assertKnownState(oldState);
  const nextIndex = INDEX.get(oldState) + 1;
  if (nextIndex >= STATES.length) throw new Error("evidence_already_human_ready");

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
    newState: STATES[nextIndex],
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
    reason: changedFields.length
      ? "EVIDENCE_IDENTITY_CHANGED"
      : null,
    requiredAction: changedFields.length
      ? "INVALIDATE_AND_REVALIDATE"
      : "NO_INVALIDATION",
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
  assertKnownState(state);
  assertKnownState(minimum);
  return INDEX.get(state) >= INDEX.get(minimum);
}
