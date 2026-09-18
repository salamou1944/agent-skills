/**
 * Deterministic referral brokerage contract.
 * No network, payment, or PII handling.
 */

export const REFERRAL_STATUSES = Object.freeze([
  "registered",
  "accepted",
  "in_progress",
  "qualified",
  "closed",
  "paid",
  "reconciled",
  "failed",
]);

export function normalizeReferral(input = {}) {
  if (!input || typeof input !== "object") throw new TypeError("referral must be an object");

  const leadId = String(input.leadId ?? "").trim();
  const providerId = String(input.providerId ?? "").trim();
  const service = String(input.service ?? "").trim();
  const commissionRate = Number(input.commissionRate);
  const status = String(input.status ?? "registered").trim();
  const attributionWindowDays = Number(input.attributionWindowDays ?? 30);

  if (!leadId || !providerId || !service) throw new Error("leadId, providerId and service are required");
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    throw new Error("commissionRate must be between 0 and 100");
  }
  if (!Number.isInteger(attributionWindowDays) || attributionWindowDays < 0) {
    throw new Error("attributionWindowDays must be a non-negative integer");
  }
  if (!REFERRAL_STATUSES.includes(status)) throw new Error("invalid referral status");

  return Object.freeze({
    leadId,
    providerId,
    service,
    commissionRate,
    attributionWindowDays,
    status,
    paymentEvidence: Boolean(input.paymentEvidence),
  });
}

export function calculateCommission({ collectedAmount, commissionRate }) {
  const amount = Number(collectedAmount);
  const rate = Number(commissionRate);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("collectedAmount must be non-negative");
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error("commissionRate must be between 0 and 100");
  return Number((amount * rate / 100).toFixed(2));
}

export function canRecognizeRevenue(referral) {
  return Boolean(
    referral &&
    (referral.status === "paid" || referral.status === "reconciled") &&
    referral.paymentEvidence === true
  );
}
