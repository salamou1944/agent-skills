const MATURITY = Object.freeze([
  "HYPOTHESIS",
  "DESIGNED",
  "IMPLEMENTED",
  "UNIT_VERIFIED",
  "INTEGRATION_VERIFIED",
  "RUNTIME_VERIFIED",
  "EXTERNAL_VERIFIED",
  "E2E_VERIFIED",
  "BUSINESS_VERIFIED",
  "HARDENED",
]);

const BLOCKING_DEPENDENCIES = new Set([
  "provider",
  "credentials",
  "billing",
  "quota",
  "platform_policy",
  "external_service",
  "human_approval",
]);

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

function evidenceIndex(maturity) {
  const i = MATURITY.indexOf(String(maturity || "HYPOTHESIS").toUpperCase());
  return i < 0 ? 0 : i;
}

function normalize(h) {
  const deps = Array.isArray(h.dependencies) ? h.dependencies.map(String) : [];
  const blocking = deps.filter((d) => BLOCKING_DEPENDENCIES.has(d));
  const status = String(h.status || "").toUpperCase();
  const blocked = status === "BLOCKED_EXTERNAL_DEPENDENCY"
    || (blocking.length > 0 && h.externalDependencyBlocked === true);
  return {
    ...h,
    id: String(h.id || ""),
    maturity: String(h.maturity || "HYPOTHESIS").toUpperCase(),
    dependencies: deps,
    blockingDependencies: blocking,
    blocked,
  };
}

/**
 * Deterministic frontier selection.
 *
 * Inputs are deliberately normalized to [0,1]. The score is a decision aid,
 * not a claim about objective value. Hard blockers are excluded separately.
 */
export function scoreFrontier(hypothesis) {
  const h = normalize(hypothesis);
  const leverage = clamp01(h.leverage);
  const feasibility = clamp01(h.feasibility);
  const evidenceSpeed = clamp01(h.evidenceSpeed);
  const reusability = clamp01(h.reusability);
  const compounding = clamp01(h.compounding);
  const informationGain = clamp01(h.informationGain);
  const bottleneckImpact = clamp01(h.bottleneckImpact);
  const capabilityMultiplication = clamp01(h.capabilityMultiplication);
  const novelty = clamp01(h.novelty);
  const cost = clamp01(h.cost);
  const fragility = clamp01(h.fragility);
  const policyRisk = clamp01(h.policyRisk);
  const complexity = clamp01(h.operationalComplexity);

  const upside =
    leverage * 0.20 +
    feasibility * 0.11 +
    evidenceSpeed * 0.11 +
    reusability * 0.10 +
    compounding * 0.12 +
    informationGain * 0.12 +
    bottleneckImpact * 0.08 +
    capabilityMultiplication * 0.08 +
    novelty * 0.08;

  const drag =
    cost * 0.08 +
    fragility * 0.05 +
    policyRisk * 0.06 +
    complexity * 0.05;

  const evidencePenalty = evidenceIndex(h.maturity) >= evidenceIndex("E2E_VERIFIED") ? 0.05 : 0;
  const blockedPenalty = h.blocked ? 0.75 : 0;

  return Math.max(0, Number((upside - drag - evidencePenalty - blockedPenalty).toFixed(6)));
}

export function rankFrontiers(hypotheses) {
  return hypotheses
    .map((h) => {
      const normalized = normalize(h);
      return {
        ...normalized,
        score: scoreFrontier(normalized),
        evidenceIndex: evidenceIndex(normalized.maturity),
      };
    })
    .sort((a, b) =>
      b.score - a.score ||
      b.informationGain - a.informationGain ||
      b.bottleneckImpact - a.bottleneckImpact ||
      b.evidenceSpeed - a.evidenceSpeed ||
      String(a.id).localeCompare(String(b.id))
    );
}

export function selectNextFrontier(hypotheses) {
  const ranked = rankFrontiers(hypotheses);
  return ranked.find((h) => !h.blocked) || null;
}

export function buildDiscoveryRecord({
  id,
  project,
  hypothesis,
  capability,
  bottleneck,
  mechanism,
  experiment,
  dependencies = [],
  maturity = "HYPOTHESIS",
  evidence = [],
  result = "UNKNOWN",
  nextAction = "",
  provenance = [],
  failureClass = "",
  repairStrategy = "",
  regressionTest = "",
  timestamp = new Date().toISOString(),
}) {
  if (!id || !project || !hypothesis || !capability || !mechanism || !experiment) {
    throw new Error("frontier_record_required_field_missing");
  }
  const record = {
    schemaVersion: 2,
    id,
    project,
    hypothesis,
    capability,
    bottleneck: bottleneck || "",
    mechanism,
    experiment,
    dependencies: [...dependencies],
    maturity: String(maturity).toUpperCase(),
    evidence: [...evidence],
    result,
    nextAction,
    provenance: [...provenance],
    failureClass,
    repairStrategy,
    regressionTest,
    timestamp,
  };
  if (!MATURITY.includes(record.maturity)) throw new Error("frontier_maturity_invalid");
  if (!Array.isArray(record.evidence)) throw new Error("frontier_evidence_invalid");
  if (record.result === "SUCCESS" && evidence.length === 0) {
    throw new Error("frontier_success_requires_evidence");
  }
  if (record.result === "SUCCESS" && evidence.length > 0 && !record.provenance.length) {
    throw new Error("frontier_success_requires_provenance");
  }
  if (record.result === "FAILURE" && !failureClass) {
    throw new Error("frontier_failure_requires_classification");
  }
  if (record.result === "FAILURE" && !regressionTest && !nextAction) {
    throw new Error("frontier_failure_requires_learning_action");
  }
  return Object.freeze(record);
}

export {
  MATURITY,
  BLOCKING_DEPENDENCIES,
  evidenceIndex,
  normalize,
};
