import assert from "node:assert/strict";
import test from "node:test";
import { chooseProvider, discoverProviders, normalizeProviderCapabilities } from "./provider-capabilities.mjs";

test("provider capability discovery is deterministic and modality-scoped", () => {
  const providers = [
    { name: "premium", endpoint: "https://p", model: "p", capabilities: ["chat", "image"], priority: 20, costPerUnit: 2 },
    { name: "free", endpoint: "https://f", model: "f", capabilities: ["chat", "image"], priority: 20, costPerUnit: 0 },
    { name: "offline", endpoint: "https://o", model: "o", capabilities: ["image"], priority: 10, healthy: false },
    { name: "audio", endpoint: "https://a", model: "a", capabilities: ["audio"], priority: 1 }
  ];
  assert.deepEqual(discoverProviders(providers, "image").map(p => p.name), ["free", "premium"]);
  assert.equal(chooseProvider(providers, "image").name, "free");
  assert.equal(chooseProvider(providers, "image", { maxCostPerUnit: 1 }).name, "free");
  assert.equal(chooseProvider(providers, "video"), null);
});

test("normalization removes unsupported capabilities and preserves safe defaults", () => {
  const p = normalizeProviderCapabilities({ name: "x", capabilities: ["chat", "secret", "chat"], priority: "bad", costPerUnit: -4 });
  assert.deepEqual(p.capabilities, ["chat"]);
  assert.equal(p.priority, 100);
  assert.equal(p.costPerUnit, 0);
  assert.equal(p.healthy, true);
});
