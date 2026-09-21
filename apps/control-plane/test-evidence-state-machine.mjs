import test from "node:test";
import assert from "node:assert/strict";
import {
  evidenceStates,
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
  timestamp: "2026-09-21T03:00:00.000Z",
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

test("defines the complete ordered evidence ladder", () => {
  assert.deepEqual(evidenceStates(), [
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
});

test("accepts a valid adjacent transition with matching provenance", () => {
  assert.equal(validateEvidenceTransition(base), true);
});

test("rejects skipped evidence levels", () => {
  assert.throws(
    () => validateEvidenceTransition({ ...base, newState: "RUNTIME_VERIFIED" }),
    /invalid_evidence_transition/,
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

test("transitionEvidence computes only the next state", () => {
  const result = transitionEvidence({
    oldState: "UNIT_VERIFIED",
    action: "integrate",
    newEvidence: "integration suite passed",
    verifier: "ci",
    source: base.source,
    commit: base.commit,
    environment: base.environment,
    provenance: base.provenance,
  });
  assert.equal(result.newState, "INTEGRATION_VERIFIED");
});

test("cannot transition beyond HUMAN_READY", () => {
  assert.throws(
    () => transitionEvidence({
      oldState: "HUMAN_READY",
      action: "reopen",
      newEvidence: "n/a",
      verifier: "none",
      source: base.source,
      commit: base.commit,
      environment: base.environment,
      provenance: base.provenance,
    }),
    /evidence_already_human_ready/,
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

test("supports maturity comparisons without ranking projects", () => {
  assert.equal(isAtLeast("HARDENED", "OBSERVED"), true);
  assert.equal(isAtLeast("RUNTIME_VERIFIED", "E2E_VERIFIED"), false);
});
