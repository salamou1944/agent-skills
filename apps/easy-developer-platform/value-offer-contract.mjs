/**
 * Deterministic value-packaging / offer economics contract.
 * No network, payment, PII, or provider calls.
 *
 * Purpose:
 * turn a product-presentation hypothesis into measurable offer economics.
 */

export const PRESENTATION_LAYERS = Object.freeze([
  "baseline",
  "brand",
  "packaging",
  "story",
  "photography",
  "video",
  "unboxing",
]);

export function normalizeValueOffer(input = {}) {
  if (!input || typeof input !== "object") throw new TypeError("offer must be an object");

  const productId = String(input.productId ?? "").trim();
  const variantId = String(input.variantId ?? "baseline").trim();
  const salePrice = Number(input.salePrice);
  const unitProductCost = Number(input.unitProductCost);
  const presentationCost = Number(input.presentationCost ?? 0);
  const trafficCostPerOrder = Number(input.trafficCostPerOrder ?? 0);
  const presentationLayers = Array.isArray(input.presentationLayers)
    ? [...new Set(input.presentationLayers.map(String).filter(x => PRESENTATION_LAYERS.includes(x)))]
    : [];

  if (!productId) throw new Error("productId is required");
  if (!Number.isFinite(salePrice) || salePrice < 0) throw new Error("salePrice must be non-negative");
  if (!Number.isFinite(unitProductCost) || unitProductCost < 0) throw new Error("unitProductCost must be non-negative");
  if (!Number.isFinite(presentationCost) || presentationCost < 0) throw new Error("presentationCost must be non-negative");
  if (!Number.isFinite(trafficCostPerOrder) || trafficCostPerOrder < 0) {
    throw new Error("trafficCostPerOrder must be non-negative");
  }

  return Object.freeze({
    productId,
    variantId,
    salePrice,
    unitProductCost,
    presentationCost,
    trafficCostPerOrder,
    presentationLayers: Object.freeze(presentationLayers),
  });
}

export function unitContributionMargin(offer) {
  const o = normalizeValueOffer(offer);
  return Number((o.salePrice - o.unitProductCost - o.presentationCost - o.trafficCostPerOrder).toFixed(2));
}

export function grossMarginRate(offer) {
  const o = normalizeValueOffer(offer);
  if (o.salePrice === 0) return 0;
  return Number((unitContributionMargin(o) / o.salePrice).toFixed(4));
}

export function requiredConversionLiftForCostRecovery({
  baselineConversionRate,
  baselineOffer,
  variantOffer,
}) {
  const baseline = normalizeValueOffer(baselineOffer);
  const variant = normalizeValueOffer(variantOffer);
  const rate = Number(baselineConversionRate);

  if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
    throw new Error("baselineConversionRate must be > 0 and <= 1");
  }

  const baselineContribution = unitContributionMargin(baseline);
  const variantContribution = unitContributionMargin(variant);
  if (baselineContribution <= 0 || variantContribution <= 0) {
    throw new Error("both offers must have positive unit contribution margin");
  }

  // Minimum variant conversion rate that preserves contribution per visitor.
  return Number(((rate * baselineContribution) / variantContribution).toFixed(6));
}

export function incrementalContributionPerVisitor({
  baselineConversionRate,
  baselineOffer,
  variantConversionRate,
  variantOffer,
}) {
  const baseRate = Number(baselineConversionRate);
  const variantRate = Number(variantConversionRate);
  if (![baseRate, variantRate].every(Number.isFinite) || baseRate < 0 || variantRate < 0 || baseRate > 1 || variantRate > 1) {
    throw new Error("conversion rates must be between 0 and 1");
  }

  const baselineContribution = unitContributionMargin(baselineOffer);
  const variantContribution = unitContributionMargin(variantOffer);
  return Number((variantRate * variantContribution - baseRate * baselineContribution).toFixed(4));
}

export function canClaimMeasuredLift({
  sampleSize,
  baselineConversionRate,
  variantConversionRate,
  independentOutcomeEvidence,
}) {
  return Boolean(
    Number.isInteger(sampleSize) &&
    sampleSize > 0 &&
    Number.isFinite(Number(baselineConversionRate)) &&
    Number.isFinite(Number(variantConversionRate)) &&
    independentOutcomeEvidence === true
  );
}
