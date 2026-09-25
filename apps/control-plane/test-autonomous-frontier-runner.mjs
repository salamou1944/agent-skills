import test from "node:test";
import assert from "node:assert/strict";
import { executeFrontier, executeHighestLeverageFrontier } from "./autonomous-frontier-runner.mjs";

const evidence = (source, extra = {}) => ({ source, ...extra });
function handlers(log) {
  return {
    execute: async () => { log.push("execute"); return { evidence: [evidence("executor")] }; },
    test: async () => { log.push("test"); return { evidence: [evidence("regression")] }; },
    verify: async () => { log.push("verify"); return { evidence: [evidence("independent-verifier")] }; },
    observe: async () => { log.push("observe"); return { evidence: [evidence("observation")] }; },
    persist: async () => { log.push("persist"); return { evidence: [evidence("canonical-store")], result: "verified" }; },
  };
}

test("runs selected frontier through the full executable lifecycle", async () => {
  const log = [];
  const result = await executeFrontier({ id: "frontier-a", project: "agent-skills", nextAction: "run-test" }, handlers(log));
  assert.equal(result.status, "COMPLETED");
  assert.deepEqual(log, ["execute","test","verify","observe","persist"]);
  assert.ok(result.evidence.some((item) => item.source === "independent-verifier"));
  assert.ok(result.evidence.some((item) => item.source === "canonical-store"));
});

test("external blockers fail closed before execution", async () => {
  let called = false;
  const result = await executeFrontier(
    { id: "provider-frontier", project: "EASY", nextAction: "generate", externalDependencyBlocked: true, dependencies: ["provider"] },
    { ...handlers([]), execute: async () => { called = true; return {}; } },
  );
  assert.equal(result.status, "BLOCKED_EXTERNAL_DEPENDENCY");
  assert.equal(result.blocker, "provider");
  assert.equal(called, false);
});

test("selection and execution are connected without inventing a frontier", async () => {
  const log = [];
  const result = await executeHighestLeverageFrontier({
    frontiers: [
      { id: "blocked", project: "EASY", nextAction: "provider", externalDependencyBlocked: true, dependencies: ["provider"] },
      { id: "selected", project: "agent-skills", nextAction: "run-test" },
    ],
    select: async (items) => items.find((item) => item.id === "selected"),
    ...handlers(log),
  });
  assert.equal(result.frontierId, "selected");
  assert.equal(result.status, "COMPLETED");
  assert.deepEqual(log, ["execute","test","verify","observe","persist"]);
});

test("no frontier is explicit, not fake success", async () => {
  const result = await executeHighestLeverageFrontier({ frontiers: [], select: async () => null, ...handlers([]) });
  assert.equal(result.status, "NO_EXECUTABLE_FRONTIER");
  assert.equal(result.phase, null);
});

test("missing verification evidence fails closed", async () => {
  const result = await executeFrontier(
    { id: "bad", project: "agent-skills", nextAction: "x" },
    { ...handlers([]), verify: async () => ({ evidence: [] }) },
  );
  assert.equal(result.status, "FAILED");
  assert.equal(result.phase, "FAILED");
  assert.match(result.error, /execution_verification_requires_evidence/);
  assert.ok(result.evidence.some((item) => item.source === "independent-verifier" && item.result === "failed"));
});


test("invalid external blocker state is rejected instead of producing fake blocked success", async () => {
  await assert.rejects(
    () => executeFrontier({ id: "bad-blocker", project: "EASY", nextAction: "x", externalDependencyBlocked: true }, handlers([])),
    /autonomous_runner_external_blocker_invalid/,
  );
});

test("executor failure becomes explicit FAILED state with persisted failure evidence", async () => {
  const result = await executeFrontier(
    { id: "executor-fail", project: "agent-skills", nextAction: "x" },
    { ...handlers([]), execute: async () => { throw new Error("boom"); } },
  );
  assert.equal(result.status, "FAILED");
  assert.equal(result.phase, "FAILED");
  assert.ok(result.evidence.some((item) => item.source === "executor" && item.result === "failed"));
});

test("verification failure becomes explicit FAILED state", async () => {
  const result = await executeFrontier(
    { id: "verify-fail", project: "agent-skills", nextAction: "x" },
    { ...handlers([]), verify: async () => { throw new Error("verify-boom"); } },
  );
  assert.equal(result.status, "FAILED");
  assert.equal(result.phase, "FAILED");
  assert.ok(result.evidence.some((item) => item.source === "independent-verifier" && item.result === "failed"));
});


test("continuous runner recomputes discovery after each meaningful result", async () => {
  const log = [];
  let discoveryCount = 0;
  const frontiers = [
    { id: "f1", project: "agent-skills", nextAction: "first" },
    { id: "f2", project: "agent-skills", nextAction: "second" },
  ];
  const result = await (await import("./autonomous-frontier-runner.mjs")).runContinuousFrontiers({
    discover: async () => {
      discoveryCount += 1;
      return discoveryCount === 1 ? [frontiers[0]] : discoveryCount === 2 ? [frontiers[1]] : [];
    },
    select: async (items) => items[0] || null,
    ...handlers(log),
  });
  assert.equal(result.status, "NO_EXECUTABLE_FRONTIER");
  assert.equal(result.iterations, 3);
  assert.equal(discoveryCount, 3);
  assert.equal(result.history[0].result.frontierId, "f1");
  assert.equal(result.history[1].result.frontierId, "f2");
});
