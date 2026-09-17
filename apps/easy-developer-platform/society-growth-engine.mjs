/**
 * Deterministic Society Growth Engine.
 *
 * This is the policy/evidence layer, not a spam sender and not a web scraper.
 * External adapters may feed public observations; outbound adapters must enforce
 * consent/relevance/suppression/rate limits before sending.
 */

export const SOCIETY_ENGINE_VERSION = "1.0.0";

const VALID_STAGES = new Set([
  "observed",
  "qualified",
  "eligible",
  "contacted",
  "replied",
  "converted",
  "revenue_verified",
  "suppressed",
]);

export function observeSignal(input = {}) {
  if (!input.source || !input.signal) {
    throw new Error("OBSERVATION_REQUIRES_SOURCE_AND_SIGNAL");
  }
  return {
    id: input.id ?? `obs_${hashStable(input.source + "|" + input.signal)}`,
    source: String(input.source),
    signal: String(input.signal),
    observedAt: input.observedAt ?? new Date().toISOString(),
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    stage: "observed",
  };
}

export function qualifyOpportunity(observation, fit = {}) {
  if (!observation || observation.stage !== "observed") {
    throw new Error("FISHER_REQUIRES_OBSERVED_SIGNAL");
  }
  const score = Number(fit.score ?? 0);
  const reasons = Array.isArray(fit.reasons) ? fit.reasons.filter(Boolean) : [];
  const qualified = score >= 0.7 && reasons.length > 0 && observation.evidence.length > 0;
  return {
    ...observation,
    stage: qualified ? "qualified" : "observed",
    qualification: { score, reasons, qualified },
  };
}

export function mailingEligibility(opportunity, policy = {}) {
  if (!opportunity || opportunity.stage !== "qualified") return { eligible: false, reason: "NOT_QUALIFIED" };
  if (policy.suppressed === true) return { eligible: false, reason: "SUPPRESSED" };
  if (policy.duplicate === true) return { eligible: false, reason: "DUPLICATE" };
  if (policy.consentRequired && policy.consent !== true) {
    return { eligible: false, reason: "CONSENT_REQUIRED" };
  }
  if (policy.relevanceConfirmed !== true) return { eligible: false, reason: "RELEVANCE_UNCONFIRMED" };
  if (Number(policy.dailyContactCount ?? 0) >= Number(policy.dailyLimit ?? 1)) {
    return { eligible: false, reason: "RATE_LIMIT" };
  }
  return { eligible: true, reason: "ELIGIBLE" };
}

export function recordOutcome(current, outcome) {
  if (!current || !VALID_STAGES.has(current.stage)) throw new Error("INVALID_OPPORTUNITY");
  const next = String(outcome);
  const allowed = {
    qualified: ["eligible", "suppressed"],
    eligible: ["contacted", "suppressed"],
    contacted: ["replied", "suppressed"],
    replied: ["converted", "suppressed"],
    converted: ["revenue_verified"],
    revenue_verified: [],
    observed: ["qualified", "suppressed"],
    suppressed: [],
  };
  if (!allowed[current.stage].includes(next)) {
    throw new Error(`INVALID_TRANSITION_${current.stage}_TO_${next}`);
  }
  return { ...current, stage: next };
}

export function buildMetrics(records = [], terminalTasks = []) {
  const count = (stage) => records.filter((r) => r.stage === stage).length;
  const observations = records.filter((r) => ["observed", "qualified", "eligible", "contacted", "replied", "converted", "revenue_verified", "suppressed"].includes(r.stage)).length;
  const qualified = count("qualified") + count("eligible") + count("contacted") + count("replied") + count("converted") + count("revenue_verified");
  const sent = count("contacted") + count("replied") + count("converted") + count("revenue_verified");
  const positiveReplies = count("replied") + count("converted") + count("revenue_verified");
  const qualifiedReplies = positiveReplies;
  const conversions = count("converted") + count("revenue_verified");
  const verifiedRevenue = records
    .filter((r) => r.stage === "revenue_verified" && r.revenueEvidence === true)
    .reduce((sum, r) => sum + Number(r.revenue ?? 0), 0);
  const falseCompletions = terminalTasks.filter((t) => t.falseCompletion === true).length;
  return {
    observations,
    qualified,
    eligible: count("eligible"),
    sent,
    positiveReplies,
    qualifiedReplies,
    conversions,
    verifiedRevenue,
    suppressed: count("suppressed"),
    falseCompletions,
    qualificationRate: observations ? qualified / observations : 0,
    replyRate: sent ? positiveReplies / sent : 0,
    conversionRate: qualifiedReplies ? conversions / qualifiedReplies : 0,
    revenuePerContact: sent ? verifiedRevenue / sent : 0,
    falseCompletionRate: terminalTasks.length ? falseCompletions / terminalTasks.length : 0,
  };
}

function hashStable(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
