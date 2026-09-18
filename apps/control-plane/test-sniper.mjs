import test from "node:test";
import assert from "node:assert/strict";
import { analyzeFirstDeviation } from "./sniper.mjs";

test("reports baseline when nothing changed", () => {
  const signals = [{ asset: "api", type: "ip", value: "10.0.0.1" }];
  assert.equal(analyzeFirstDeviation({ signals }, { signals }).status, "baseline");
});

test("catches the first new signal and correlates signal types", () => {
  const result = analyzeFirstDeviation(
    { signals: [{ asset: "api", type: "ip", value: "10.0.0.1" }] },
    {
      signals: [
        { asset: "api", type: "ip", value: "10.0.0.1" },
        { asset: "api", type: "identity", value: "new-device" },
        { asset: "api", type: "permission", value: "admin" },
      ],
    },
  );
  assert.equal(result.status, "deviation");
  assert.equal(result.firstDeviation.value, "new-device");
  assert.ok(result.reasons.includes("correlated-multiple-signal-types"));
  assert.ok(result.confidence > 0.25);
});

test("never emits sensitive values", () => {
  const result = analyzeFirstDeviation(
    { signals: [] },
    { signals: [{ asset: "api", type: "credential", value: "key-1", token: "secret-token" }] },
  );
  assert.equal(result.firstDeviation.token, "[REDACTED]");
});
