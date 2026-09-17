import assert from "node:assert/strict";
import test from "node:test";
import {
  observeSignal,
  qualifyOpportunity,
  mailingEligibility,
  recordOutcome,
  buildMetrics,
} from "./society-growth-engine.mjs";

test("Fishers only qualifies evidence-backed high-fit signals", () => {
  const obs = observeSignal({ source: "public-demo", signal: "needs product creative", evidence: ["source-1"] });
  const qualified = qualifyOpportunity(obs, { score: 0.9, reasons: ["explicit need"] });
  assert.equal(qualified.stage, "qualified");
});

test("Mailing blocks unqualified, duplicate, suppressed and irrelevant contacts", () => {
  const obs = observeSignal({ source: "public-demo", signal: "need", evidence: ["s"] });
  const q = qualifyOpportunity(obs, { score: 0.9, reasons: ["fit"] });
  assert.equal(mailingEligibility(q, { relevanceConfirmed: true, duplicate: true }).eligible, false);
  assert.equal(mailingEligibility(q, { relevanceConfirmed: false }).reason, "RELEVANCE_UNCONFIRMED");
  assert.equal(mailingEligibility(q, { relevanceConfirmed: true, suppressed: true }).reason, "SUPPRESSED");
  assert.equal(mailingEligibility(q, { relevanceConfirmed: true, dailyContactCount: 1, dailyLimit: 1 }).reason, "RATE_LIMIT");
});

test("outcomes are monotonic and cannot fabricate revenue", () => {
  const obs = observeSignal({ source: "public-demo", signal: "need", evidence: ["s"] });
  const q = qualifyOpportunity(obs, { score: 0.9, reasons: ["fit"] });
  const e = recordOutcome(q, "eligible");
  const c = recordOutcome(e, "contacted");
  const r = recordOutcome(c, "replied");
  const converted = recordOutcome(r, "converted");
  const verified = recordOutcome(converted, "revenue_verified");
  assert.equal(verified.stage, "revenue_verified");
  assert.throws(() => recordOutcome(obs, "revenue_verified"), /INVALID_TRANSITION/);
});

test("metrics distinguish verified revenue from mere conversion", () => {
  const records = [
    { stage: "qualified" },
    { stage: "contacted" },
    { stage: "replied" },
    { stage: "converted" },
    { stage: "revenue_verified", revenueEvidence: true, revenue: 25 },
  ];
  const metrics = buildMetrics(records, [{ falseCompletion: false }]);
  assert.equal(metrics.verifiedRevenue, 25);
  assert.equal(metrics.falseCompletionRate, 0);
  assert.equal(metrics.conversions, 2);
});
