import assert from "node:assert/strict";
import { normalizeReferral, calculateCommission, canRecognizeRevenue } from "./referral-brokerage-contract.mjs";

const r = normalizeReferral({
  leadId: "lead-001",
  providerId: "provider-001",
  service: "AI automation",
  commissionRate: 15,
  attributionWindowDays: 30,
  status: "paid",
  paymentEvidence: true,
});

assert.equal(r.commissionRate, 15);
assert.equal(calculateCommission({ collectedAmount: 10000, commissionRate: 15 }), 1500);
assert.equal(canRecognizeRevenue(r), true);
assert.equal(
  canRecognizeRevenue({ status: "closed", paymentEvidence: false }),
  false
);
assert.throws(() => normalizeReferral({ leadId: "x", providerId: "y", service: "z", commissionRate: 101 }));
assert.throws(() => calculateCommission({ collectedAmount: 100, commissionRate: -1 }));

console.log("referral-brokerage-contract: PASS");
