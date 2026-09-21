const REQUIRED_FIELDS = Object.freeze([
  "source",
  "branch",
  "commit",
  "environment",
  "deploymentId",
  "snapshotId",
]);

const STATUS = Object.freeze({
  VERIFIED: "RUNTIME_PROVENANCE_VERIFIED",
  DRIFT: "SOURCE_RUNTIME_DRIFT",
  UNATTRIBUTED: "UNATTRIBUTED_RUNTIME",
  INCOMPLETE: "PROVENANCE_INCOMPLETE",
});

function clean(value) {
  return value == null || value === "" ? null : String(value);
}

function normalize(input = {}) {
  return Object.freeze(Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, clean(input[field])]),
  ));
}

function mismatch(field, expected, actual, reason) {
  return Object.freeze({ field, expected, actual, reason });
}

/**
 * Compare a deployment/runtime identity against the exact source identity
 * intended for deployment. This is a detector/verifier contract only:
 * it never mutates deployment state and never treats health as provenance.
 */
export function verifyRuntimeProvenance({ expected = {}, actual = {} } = {}) {
  const source = normalize(expected);
  const runtime = normalize(actual);
  const mismatches = [];

  if (!runtime.commit || !runtime.source || !runtime.branch || !runtime.environment) {
    return Object.freeze({
      status: STATUS.UNATTRIBUTED,
      verified: false,
      expected: source,
      actual: runtime,
      mismatches: Object.freeze([
        mismatch("identity", source, runtime, "runtime_identity_incomplete"),
      ]),
    });
  }

  for (const field of ["source", "branch", "commit", "environment"]) {
    if (!source[field]) {
      mismatches.push(mismatch(field, null, runtime[field], "expected_identity_missing"));
    } else if (source[field] !== runtime[field]) {
      mismatches.push(mismatch(field, source[field], runtime[field], "identity_mismatch"));
    }
  }

  if (source.deploymentId && runtime.deploymentId && source.deploymentId !== runtime.deploymentId) {
    mismatches.push(mismatch("deploymentId", source.deploymentId, runtime.deploymentId, "deployment_mismatch"));
  }

  if (source.snapshotId && runtime.snapshotId && source.snapshotId !== runtime.snapshotId) {
    mismatches.push(mismatch("snapshotId", source.snapshotId, runtime.snapshotId, "snapshot_mismatch"));
  }

  const status = mismatches.length
    ? STATUS.DRIFT
    : STATUS.VERIFIED;

  return Object.freeze({
    status,
    verified: status === STATUS.VERIFIED,
    expected: source,
    actual: runtime,
    mismatches: Object.freeze(mismatches),
  });
}

export function buildProvenanceRecoveryRequirement(result) {
  if (!result || typeof result.status !== "string") {
    throw new Error("provenance_result_required");
  }
  if (result.status === STATUS.VERIFIED) {
    return Object.freeze({ required: false, action: null, reason: "provenance_verified" });
  }
  if (result.status === STATUS.UNATTRIBUTED) {
    return Object.freeze({
      required: true,
      action: "ESTABLISH_RUNTIME_IDENTITY",
      reason: "runtime_identity_incomplete",
    });
  }
  return Object.freeze({
    required: true,
    action: "REDEPLOY_EXACT_COMMIT_AFTER_SOURCE_REVALIDATION",
    reason: "source_runtime_drift",
  });
}

export { REQUIRED_FIELDS, STATUS, normalize };
