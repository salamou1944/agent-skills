import assert from "node:assert/strict";
import {
  normalizeValueOffer,
  unitContributionMargin,
  grossMarginRate,
  requiredConversionLiftForCostRecovery,
  incrementalContributionPerVisitor,
  canClaimMeasuredLift,
} from "./value-offer-contract.mjs";

const baseline = normalizeValueOffer({
  productId: "candle-001",
  variantId: "baseline",
  salePrice: 80,
  unitProductCost: 50,
  presentationCost: 0,
  trafficCostPerOrder: 0,
});

const premium = normalizeValueOffer({
  productId: "candle-001",
  variantId: "premium",
  salePrice: 250,
  unitProductCost: 50,
  presentationCost: 25,
  trafficCostPerOrder: 10,
  presentationLayers: ["brand", "packaging", "story", "photography", "unboxing"],
});

assert.equal(unitContributionMargin(baseline), 30);
assert.equal(unitContributionMargin(premium), 165);
assert.equal(grossMarginRate(premium), 0.66);

const breakEvenRate = requiredConversionLiftForCostRecovery({
  baselineConversionRate: 0.02,
  baselineOffer: baseline,
  variantOffer: premium,
});
assert.equal(breakEvenRate, 0.003636);

assert.equal(
  incrementalContributionPerVisitor({
    baselineConversionRate: 0.02,
    baselineOffer: baseline,
    variantConversionRate: 0.01,
    variantOffer: premium,
  }),
  1.05
);

assert.equal(
  canClaimMeasuredLift({
    sampleSize: 1000,
    baselineConversionRate: 0.02,
    variantConversionRate: 0.025,
    independentOutcomeEvidence: true,
  }),
  true
);

assert.equal(
  canClaimMeasuredLift({
    sampleSize: 1000,
    baselineConversionRate: 0.02,
    variantConversionRate: 0.025,
    independentOutcomeEvidence: false,
  }),
  false
);

assert.throws(() => normalizeValueOffer({
  productId: "x",
  salePrice: -1,
  unitProductCost: 10,
}));

console.log("value-offer-contract: PASS");
