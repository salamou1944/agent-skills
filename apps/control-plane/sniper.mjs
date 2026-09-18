/**
 * SNIPER — first-deviation defensive detector.
 *
 * Pure, side-effect-free analysis: callers provide a trusted baseline and
 * current observations. SNIPER identifies novel or changed signals and
 * correlates them without treating a single anomaly as proof of compromise.
 */

const SENSITIVE_KEYS = new Set(["token", "secret", "password", "apiKey", "authorization"]);

function redact(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [
      key,
      SENSITIVE_KEYS.has(key) ? "[REDACTED]" : redact(v),
    ]),
  );
}

function stableKey(signal) {
  return [
    signal.asset ?? "",
    signal.type ?? "",
    signal.value ?? "",
    signal.actor ?? "",
  ].join("\u001f");
}

/**
 * @param {{signals?: object[], approvedChangeIds?: string[]}} baseline
 * @param {{signals?: object[], approvedChangeIds?: string[]}} observed
 * @returns {{status:string, firstDeviation:object|null, deviations:object[], confidence:number, reasons:string[]}}
 */
export function analyzeFirstDeviation(baseline = {}, observed = {}) {
  const base = new Set((baseline.signals ?? []).map(stableKey));
  const deviations = (observed.signals ?? [])
    .filter((signal) => !base.has(stableKey(signal)))
    .map((signal) => redact({ ...signal, kind: "unexplained-deviation" }));

  if (deviations.length === 0) {
    return { status: "baseline", firstDeviation: null, deviations: [], confidence: 0, reasons: [] };
  }

  const types = new Set(deviations.map((x) => x.type));
  const reasons = [];
  if (types.has("ip") || types.has("network")) reasons.push("new-network-signal");
  if (types.has("identity") || types.has("session")) reasons.push("new-identity-signal");
  if (types.has("credential") || types.has("permission")) reasons.push("security-boundary-change");
  if (types.has("code") || types.has("dependency") || types.has("config") || types.has("deployment")) {
    reasons.push("engineering-change");
  }
  if (types.size >= 2) reasons.push("correlated-multiple-signal-types");

  const confidence = Math.min(0.95, 0.25 + (types.size >= 2 ? 0.25 : 0) + (deviations.length >= 3 ? 0.15 : 0));
  return {
    status: "deviation",
    firstDeviation: deviations[0],
    deviations,
    confidence,
    reasons,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(await new Response(process.stdin).text());
  const result = analyzeFirstDeviation(input.baseline, input.observed);
  process.stdout.write(JSON.stringify(result) + "\n");
}
