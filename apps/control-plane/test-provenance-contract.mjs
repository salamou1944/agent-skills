import test from "node:test";
import assert from "node:assert/strict";
import { buildProvenanceRecoveryRequirement, STATUS, verifyRuntimeProvenance } from "./provenance-contract.mjs";

const base = {
  source: "salamou1944/agent-skills",
  branch: "main",
  commit: "47658e770ab31e4569bcd7c51266b737e8b4bb52",
  environment: "production",
  deploymentId: "dep-1",
  snapshotId: "snap-1",
};

test("verifies exact source/runtime identity", () => {
  const result = verifyRuntimeProvenance({ expected: base, actual: base });
  assert.equal(result.status, STATUS.VERIFIED);
  assert.equal(result.verified, true);
  assert.deepEqual(result.mismatches, []);
  assert.equal(buildProvenanceRecoveryRequirement(result).required, false);
});

test("detects stale runtime commit", () => {
  const result = verifyRuntimeProvenance({
    expected: base,
    actual: { ...base, commit: "648e7a809c5a3cae2da34519b39a32909aef0902" },
  });
  assert.equal(result.status, STATUS.DRIFT);
  assert.equal(result.mismatches[0].field, "commit");
  assert.equal(buildProvenanceRecoveryRequirement(result).action, "REDEPLOY_EXACT_COMMIT_AFTER_SOURCE_REVALIDATION");
});

test("detects wrong branch and environment", () => {
  const result = verifyRuntimeProvenance({
    expected: base,
    actual: { ...base, branch: "develop", environment: "staging" },
  });
  assert.equal(result.status, STATUS.DRIFT);
  assert.deepEqual(result.mismatches.map((x) => x.field), ["branch", "environment"]);
});

test("detects deployment and snapshot drift when both are attributable", () => {
  const result = verifyRuntimeProvenance({
    expected: base,
    actual: { ...base, deploymentId: "dep-2", snapshotId: "snap-2" },
  });
  assert.equal(result.status, STATUS.DRIFT);
  assert.deepEqual(result.mismatches.map((x) => x.field), ["deploymentId", "snapshotId"]);
});

test("fails closed when runtime identity is incomplete", () => {
  const result = verifyRuntimeProvenance({
    expected: base,
    actual: { source: base.source, branch: base.branch, environment: base.environment },
  });
  assert.equal(result.status, STATUS.UNATTRIBUTED);
  assert.equal(result.verified, false);
  assert.equal(buildProvenanceRecoveryRequirement(result).action, "ESTABLISH_RUNTIME_IDENTITY");
});

test("does not use deployment health as provenance", () => {
  const result = verifyRuntimeProvenance({
    expected: base,
    actual: { ...base, health: "healthy", commit: null },
  });
  assert.equal(result.status, STATUS.UNATTRIBUTED);
  assert.equal(result.verified, false);
});
