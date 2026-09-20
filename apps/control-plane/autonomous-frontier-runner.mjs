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
  const execution = await execute(frontier);
  state = transitionExecution(state, "EXECUTING", { evidence: normalizeEvidence(execution?.evidence) });
  const tested = await test({ frontier, execution });
  state = transitionExecution(state, "TESTING", { evidence: normalizeEvidence(tested?.evidence) });
  if (tested?.externalBlocker) {
    const blocker = normalizeBlocker(tested.externalBlocker);
    state = transitionExecution(state, "FAILED", { evidence: [{ source: "test", result: "blocked", blocker }] });
    return Object.freeze({ status: "BLOCKED_EXTERNAL_DEPENDENCY", frontierId: plan.frontierId,
      project: plan.project, blocker, phase: state.phase, evidence: state.evidence });
  }
  const verification = await verify({ frontier, execution, tested });
  state = transitionExecution(state, "VERIFYING", { evidence: normalizeEvidence(verification?.evidence) });
  const observation = await observe({ frontier, execution, tested, verification });
  state = transitionExecution(state, "OBSERVING", { evidence: normalizeEvidence(observation?.evidence) });
  const persisted = await persist({ frontier, execution, tested, verification, observation, state });
  state = transitionExecution(state, "PERSISTING", { evidence: normalizeEvidence(persisted?.evidence) });
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
