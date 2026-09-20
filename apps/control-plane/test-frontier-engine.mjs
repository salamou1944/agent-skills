import test from "node:test";
import assert from "node:assert/strict";
import {
  MATURITY,
  scoreFrontier,
  rankFrontiers,
  selectNextFrontier,
  buildDiscoveryRecord,
} from "./frontier-engine.mjs";

const base = {
  maturity: "HYPOTHESIS",
  leverage: 0.7,
  feasibility: 0.8,
  evidenceSpeed: 0.8,
  reusability: 0.8,
  compounding: 0.8,
  informationGain: 0.8,
  bottleneckImpact: 0.5,
  capabilityMultiplication: 0.5,
  novelty: 0.4,
};

test("compounding and information gain can beat a merely feasible idea", () => {
  const ranked = rankFrontiers([
    {
      id: "routine-fix",
      ...base,
      leverage: 0.55, feasibility: 0.95, evidenceSpeed: 0.95,
      reusability: 0.2, compounding: 0.1, informationGain: 0.1,
    },
    {
      id: "meta-loop",
      ...base,
      leverage: 0.8, feasibility: 0.75, evidenceSpeed: 0.8,
      reusability: 0.95, compounding: 0.95, informationGain: 0.95,
      bottleneckImpact: 0.9, capabilityMultiplication: 0.9,
    },
  ]);
  assert.equal(ranked[0].id, "meta-loop");
});

test("blocked external dependencies never masquerade as the next frontier", () => {
  const next = selectNextFrontier([
    {
      id: "provider-blocked",
      ...base,
      maturity: "RUNTIME_VERIFIED",
      leverage: 1, feasibility: 1, evidenceSpeed: 1,
      reusability: 1, compounding: 1, informationGain: 1,
      bottleneckImpact: 1, capabilityMultiplication: 1, novelty: 1,
      dependencies: ["provider"],
      externalDependencyBlocked: true,
      status: "BLOCKED_EXTERNAL_DEPENDENCY",
    },
    {
      id: "local-proof",
      ...base,
      leverage: 0.7, feasibility: 0.9, evidenceSpeed: 0.9,
      reusability: 0.8, compounding: 0.7, informationGain: 0.8,
    },
  ]);
  assert.equal(next.id, "local-proof");
});

test("success requires evidence and provenance", () => {
  assert.throws(
    () => buildDiscoveryRecord({
      id: "x", project: "agent-skills", hypothesis: "x", capability: "x",
      mechanism: "x", experiment: "x", result: "SUCCESS",
      evidence: ["test-output"],
    }),
    /frontier_success_requires_provenance/,
  );
  assert.throws(
    () => buildDiscoveryRecord({
      id: "x", project: "agent-skills", hypothesis: "x", capability: "x",
      mechanism: "x", experiment: "x", result: "SUCCESS",
    }),
    /frontier_success_requires_evidence/,
  );
});

test("failure must become a classified learning event", () => {
  assert.throws(
    () => buildDiscoveryRecord({
      id: "f", project: "agent-skills", hypothesis: "x", capability: "x",
      mechanism: "x", experiment: "x", result: "FAILURE",
    }),
    /frontier_failure_requires_classification/,
  );
  const record = buildDiscoveryRecord({
    id: "f2", project: "agent-skills", hypothesis: "x", capability: "x",
    mechanism: "x", experiment: "x", result: "FAILURE",
    failureClass: "provider_quota",
    nextAction: "queue_and_retest",
  });
  assert.equal(record.failureClass, "provider_quota");
});

test("records are immutable and schema-bounded", () => {
  const record = buildDiscoveryRecord({
    id: "frontier-1",
    project: "agent-skills",
    hypothesis: "test",
    capability: "test",
    mechanism: "test",
    experiment: "test",
    maturity: "E2E_VERIFIED",
    evidence: ["test-output"],
    result: "SUCCESS",
    nextAction: "attack",
    provenance: ["commit:abc"],
  });
  assert.equal(record.schemaVersion, 2);
  assert.ok(Object.isFrozen(record));
  assert.deepEqual(MATURITY.slice(0, 3), ["HYPOTHESIS", "DESIGNED", "IMPLEMENTED"]);
});
