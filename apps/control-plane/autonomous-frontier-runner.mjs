import { buildExecutionPlan, createExecutionState, transitionExecution } from "./execution-loop.mjs";

const EXTERNAL_BLOCKERS = new Set(["provider","credentials","billing","quota","external_service","human_approval"]);

function requiredFunction(value, field) {
  if (typeof value !== "function") throw new Error(`autonomous_runner_${field}_required`);
  return value;
}
function normalizeBlocker(value) {
  const blocker = String(value || "").trim().toLowerCase();
  if (!EXTERNAL_BLOCKERS.has(blocker)) throw new Error("autonomous_runner_external_blocker_invalid");
  return blocker;
}
function normalizeEvidence(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("autonomous_runner_evidence_array_required");
  return value;
}

/** Executes one selected frontier through the evidence-gated lifecycle. */
export async function executeFrontier(frontier, { execute, test, verify, observe, persist, initialEvidence = [] } = {}) {
  requiredFunction(execute, "execute"); requiredFunction(test, "test"); requiredFunction(verify, "verify");
  requiredFunction(observe, "observe"); requiredFunction(persist, "persist");
  const plan = buildExecutionPlan(frontier);
  let state = createExecutionState({
    id: `${plan.frontierId}:execution`, project: plan.project, frontierId: plan.frontierId,
    phase: plan.startPhase, evidence: initialEvidence, blocker: plan.blockedDependency || "",
  });
  if (state.phase === "BLOCKED_EXTERNAL_DEPENDENCY") {
    return Object.freeze({ status: state.phase, frontierId: plan.frontierId, project: plan.project,
      blocker: normalizeBlocker(plan.blockedDependency), phase: state.phase, evidence: state.evidence });
  }
  const runPhase = async (phase, handler, input, source) => {
    try {
      const output = await handler(input);
      const evidence = normalizeEvidence(output?.evidence);
      state = transitionExecution(state, phase, { evidence });
      return output;
    } catch (error) {
      const failureEvidence = [{ source, result: "failed", error: String(error?.message || error) }];
      try { state = transitionExecution(state, "FAILED", { evidence: failureEvidence }); } catch {}
      return { __failure: error, evidence: failureEvidence };
    }
  };

  const execution = await runPhase("EXECUTING", execute, frontier, "executor");
  if (execution?.__failure) return Object.freeze({ status: "FAILED", frontierId: plan.frontierId, project: plan.project, blocker: "", phase: state.phase, evidence: state.evidence, error: execution.__failure.message });
  const tested = await runPhase("TESTING", test, { frontier, execution }, "regression-test");
  if (tested?.__failure) return Object.freeze({ status: "FAILED", frontierId: plan.frontierId, project: plan.project, blocker: "", phase: state.phase, evidence: state.evidence, error: tested.__failure.message });
  if (tested?.externalBlocker) {
    const blocker = normalizeBlocker(tested.externalBlocker);
    state = transitionExecution(state, "FAILED", { evidence: [{ source: "test", result: "blocked", blocker }] });
    return Object.freeze({ status: "BLOCKED_EXTERNAL_DEPENDENCY", frontierId: plan.frontierId,
      project: plan.project, blocker, phase: state.phase, evidence: state.evidence });
  }
  const verification = await runPhase("VERIFYING", verify, { frontier, execution, tested }, "independent-verifier");
  if (verification?.__failure) return Object.freeze({ status: "FAILED", frontierId: plan.frontierId, project: plan.project, blocker: "", phase: state.phase, evidence: state.evidence, error: verification.__failure.message });
  const observation = await runPhase("OBSERVING", observe, { frontier, execution, tested, verification }, "observer");
  if (observation?.__failure) return Object.freeze({ status: "FAILED", frontierId: plan.frontierId, project: plan.project, blocker: "", phase: state.phase, evidence: state.evidence, error: observation.__failure.message });
  const persisted = await runPhase("PERSISTING", persist, { frontier, execution, tested, verification, observation, state }, "canonical-store");
  if (persisted?.__failure) return Object.freeze({ status: "FAILED", frontierId: plan.frontierId, project: plan.project, blocker: "", phase: state.phase, evidence: state.evidence, error: persisted.__failure.message });
  state = transitionExecution(state, "COMPLETED", { evidence: normalizeEvidence(persisted?.evidence) });
  return Object.freeze({ status: state.phase, frontierId: plan.frontierId, project: plan.project,
    blocker: "", phase: state.phase, evidence: state.evidence, result: persisted?.result || "COMPLETED" });
}

export async function executeHighestLeverageFrontier({ frontiers, select, ...handlers } = {}) {
  if (!Array.isArray(frontiers)) throw new Error("autonomous_runner_frontiers_required");
  requiredFunction(select, "select");
  const frontier = await select(frontiers);
  if (!frontier) return Object.freeze({ status: "NO_EXECUTABLE_FRONTIER", frontierId: null, project: null, blocker: "", phase: null, evidence: [] });
  return executeFrontier(frontier, handlers);
}


/** Recomputes and executes frontiers until discovery produces no executable work or the safety cap is reached. */
export async function runContinuousFrontiers({ discover, select, maxIterations = 25, ...handlers } = {}) {
  requiredFunction(discover, "discover");
  requiredFunction(select, "select");
  if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 1000) {
    throw new Error("autonomous_runner_max_iterations_invalid");
  }
  const history = [];
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const discovered = await discover({ iteration, history: Object.freeze([...history]) });
    if (!Array.isArray(discovered)) throw new Error("autonomous_runner_discovery_array_required");
    const result = await executeHighestLeverageFrontier({
      frontiers: discovered,
      select: (items) => select(items, { iteration, history: Object.freeze([...history]) }),
      ...handlers,
    });
    history.push(Object.freeze({ iteration, result }));
    if (result.status === "NO_EXECUTABLE_FRONTIER") {
      return Object.freeze({ status: result.status, iterations: history.length, history: Object.freeze(history) });
    }
  }
  return Object.freeze({ status: "ITERATION_LIMIT_REACHED", iterations: history.length, history: Object.freeze(history) });
}
