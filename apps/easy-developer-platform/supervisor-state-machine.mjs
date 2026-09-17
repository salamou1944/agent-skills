#!/usr/bin/env node

export const SUPERVISOR_STATES = Object.freeze(['DISCOVER','PLAN','ASSIGN','EXECUTE','VERIFY','REPAIR','REVERIFY','INTEGRATE','FINAL_VERIFY','DONE','FAILED']);
const transitions = Object.freeze({
  DISCOVER:['PLAN','FAILED'], PLAN:['ASSIGN','FAILED'], ASSIGN:['EXECUTE','FAILED'], EXECUTE:['VERIFY','FAILED'],
  VERIFY:['INTEGRATE','REPAIR','FAILED'], REPAIR:['REVERIFY','FAILED'], REVERIFY:['INTEGRATE','REPAIR','FAILED'],
  INTEGRATE:['FINAL_VERIFY','REPAIR','FAILED'], FINAL_VERIFY:['DONE','REPAIR','FAILED'], DONE:[], FAILED:[]
});

export function createSupervisorState({ maxRepairs = 3, maxTransitions = 30 } = {}) {
  let state = 'DISCOVER';
  let repairs = 0;
  let transitionsCount = 0;
  const history = [{ state, at: new Date().toISOString() }];
  return {
    get state() { return state; },
    get repairs() { return repairs; },
    get history() { return [...history]; },
    transition(next) {
      if (!SUPERVISOR_STATES.includes(next) || !transitions[state]?.includes(next)) throw new Error(`invalid_supervisor_transition:${state}->${next}`);
      if (next === 'REPAIR') { repairs += 1; if (repairs > maxRepairs) { state = 'FAILED'; history.push({ state, reason:'repair_budget_exhausted', at:new Date().toISOString() }); return state; } }
      transitionsCount += 1;
      if (transitionsCount > maxTransitions) { state = 'FAILED'; history.push({ state, reason:'transition_budget_exhausted', at:new Date().toISOString() }); return state; }
      state = next;
      history.push({ state, at: new Date().toISOString() });
      return state;
    },
    fail(reason = 'unspecified') { state = 'FAILED'; history.push({ state, reason, at:new Date().toISOString() }); return state; }
  };
}

export function assertTerminal(state) {
  if (!['DONE','FAILED'].includes(state)) throw new Error(`supervisor_not_terminal:${state}`);
  return state;
}
