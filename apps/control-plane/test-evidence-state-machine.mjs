import test from "node:test";
import assert from "node:assert/strict";
import {
  evidenceStates,
  evidenceMaturityStates,
  evidenceQualifiers,
  transitionEvidence,
  validateEvidenceTransition,
  invalidateEvidenceOnIdentityChange,
  assertEvidenceUsable,
  isAtLeast,
} from "./evidence-state-machine.mjs";

const base = {
  oldState: "DISCOVERED",
  action: "implement",
  newEvidence: "source implementation exists",
  verifier: "independent-ci",
  timestamp: "2026-01-01T00:00:00.000Z",
  source: "salamou1944/agent-skills",
  commit: "abc123",
  environment: "ci",
  provenance: {
    source: "salamou1944/agent-skills",
    branch: "main",
    commit: "abc123",
    environment: "ci",
  },
  newState: "IMPLEMENTED",
};

test("defines the canonical evidence maturity ladder only", () => {
  const expected = [
    "DISCOVERED",
    "IMPLEMENTED",
    "UNIT_VERIFIED",
    "INTEGRATION_VERIFIED",
    "RUNTIME_VERIFIED",
    "PROVIDER_VERIFIED",
    "E2E_VERIFIED",
    "BUSINESS_FLOW_VERIFIED",
  ];
  assert.deepEqual(evidenceMaturityStates(), expected);
  assert.deepEqual(evidenceStates(), expected);
});

test("defines qualifiers independently from maturity", () => {
  assert.deepEqual(evidenceQualifiers(), [
    "OBSERVED",
    "PERSISTED",
    "TRACEABLE",
    "REPRODUCIBLE",
    "HARDENED",
  ]);
});

test("accepts a valid adjacent transition with matching provenance", () => {
  assert.equal(validateEvidenceTransition(base), true);
});

test("accepts independent evidence qualifiers without turning them into maturity states", () => {
  assert.equal(validateEvidenceTransition({
    ...base,
    qualifiers: ["OBSERVED", "PERSISTED", "TRACEABLE"],
  }), true);
});

test("rejects skipped evidence levels", () => {
  assert.throws(
    () => validateEvidenceTransition({ ...base, newState: "RUNTIME_VERIFIED" }),
    /invalid_evidence_transition/,
  );
});

test("rejects unknown qualifiers", () => {
  assert.throws(
    () => validateEvidenceTransition({ ...base, qualifiers: ["HUMAN_READY"] }),
    /unknown_evidence_qualifier/,
  );
});

test("rejects provenance commit mismatch", () => {
  assert.throws(
    () => validateEvidenceTransition({
      ...base,
      provenance: { ...base.provenance, commit: "different" },
    }),
    /provenance_commit_mismatch/,
  );
});

test("transitionEvidence computes only the next maturity state", () => {
  const result = transitionEvidence({
    oldState: "UNIT_VERIFIED",
    action: "integrate",
    newEvidence: "integration suite passed",
    verifier: "ci",
    source: base.source,
    commit: base.commit,
    environment: base.environment,
    provenance: base.provenance,
    qualifiers: ["OBSERVED"],
  });
  assert.equal(result.newState, "INTEGRATION_VERIFIED");
  assert.deepEqual(result.qualifiers, ["OBSERVED"]);
});

test("cannot advance beyond the maximum maturity level", () => {
  assert.throws(
    () => transitionEvidence({
      oldState: "BUSINESS_FLOW_VERIFIED",
      action: "advance",
      newEvidence: "n/a",
      verifier: "none",
      source: base.source,
      commit: base.commit,
      environment: base.environment,
      provenance: base.provenance,
    }),
    /evidence_maturity_already_maximum/,
  );
});

test("detects commit drift as stale evidence", () => {
  const result = invalidateEvidenceOnIdentityChange(
    { source: base.source, commit: "old", environment: "prod", deployment: "d1", runtime: "old" },
    { source: base.source, commit: "new", environment: "prod", deployment: "d1", runtime: "new" },
  );
  assert.equal(result.stale, true);
  assert.deepEqual(result.changedFields, ["commit", "runtime"]);
  assert.equal(result.requiredAction, "INVALIDATE_AND_REVALIDATE");
});

test("detects environment drift as stale evidence", () => {
  const result = invalidateEvidenceOnIdentityChange(
    { source: base.source, commit: "a", environment: "staging", deployment: "d1", runtime: "a" },
    { source: base.source, commit: "a", environment: "production", deployment: "d1", runtime: "a" },
  );
  assert.deepEqual(result.changedFields, ["environment"]);
});

test("keeps evidence usable when identity is unchanged", () => {
  const identity = { source: base.source, commit: "a", environment: "production", deployment: "d1", runtime: "a" };
  assert.equal(assertEvidenceUsable(identity, { ...identity }), true);
});

test("fails closed on stale evidence instead of silently reusing it", () => {
  const identity = { source: base.source, commit: "a", environment: "production", deployment: "d1", runtime: "a" };
  assert.throws(
    () => assertEvidenceUsable(identity, { ...identity, deployment: "d2" }),
    /STALE_EVIDENCE:deployment/,
  );
});

test("rejects qualifiers when used as maturity comparison inputs", () => {
  assert.throws(
    () => isAtLeast("BUSINESS_FLOW_VERIFIED", "OBSERVED"),
    /unknown_evidence_maturity:OBSERVED/,
  );
});

test("supports valid maturity comparisons", () => {
  assert.equal(isAtLeast("BUSINESS_FLOW_VERIFIED", "E2E_VERIFIED"), true);
  assert.equal(isAtLeast("E2E_VERIFIED", "BUSINESS_FLOW_VERIFIED"), false);
});

test("rejects non-canonical timestamps", () => {
  assert.throws(
    () => validateEvidenceTransition({ ...base, timestamp: "not-a-timestamp" }),
    /timestamp_invalid/,
  );
  assert.throws(
    () => validateEvidenceTransition({ ...base, timestamp: "2026-01-01T00:00:00Z" }),
    /timestamp_invalid/,
  );
});

test("rejects future timestamps", () => {
  assert.throws(
    () => validateEvidenceTransition({ ...base, timestamp: "2999-01-01T00:00:00.000Z" }),
    /timestamp_in_future/,
  );
});
