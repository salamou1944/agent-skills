import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionPlan, createExecutionState, transitionExecution } from './execution-loop.mjs';

test('builds an executable plan', () => {
  const plan = buildExecutionPlan({ id:'frontier-1', project:'agent-skills', experiment:'exercise next frontier', status:'READY' });
  assert.equal(plan.startPhase, 'SELECTED');
  assert.deepEqual(plan.steps, ['EXECUTING','TESTING','VERIFYING','OBSERVING','PERSISTING','COMPLETED']);
});

test('external blockers remain blocked', () => {
  const plan = buildExecutionPlan({ id:'provider-frontier', project:'EASY', nextAction:'retry provider', status:'BLOCKED_EXTERNAL_DEPENDENCY', dependencies:['quota'] });
  assert.equal(plan.startPhase, 'BLOCKED_EXTERNAL_DEPENDENCY');
  assert.equal(plan.blockedDependency, 'quota');
});

test('verification requires evidence', () => {
  const state = createExecutionState({ id:'run-1', project:'agent-skills', frontierId:'frontier-1', phase:'TESTING' });
  assert.throws(() => transitionExecution(state, 'VERIFYING'), /execution_verification_requires_evidence/);
});

test('evidence persists through every evidence-gated completion boundary', () => {
  let state = createExecutionState({ id:'run-2', project:'agent-skills', frontierId:'frontier-2', phase:'SELECTED' });
  state = transitionExecution(state, 'EXECUTING');
  state = transitionExecution(state, 'TESTING', { evidence:['test-output'] });
  state = transitionExecution(state, 'VERIFYING', { evidence:['independent-check'] });
  state = transitionExecution(state, 'OBSERVING');
  state = transitionExecution(state, 'PERSISTING', { evidence:['persistence-check'] });
  state = transitionExecution(state, 'COMPLETED', { evidence:['completion-check'] });
  assert.equal(state.phase, 'COMPLETED');
  assert.equal(state.evidence.length, 4);
  assert.deepEqual(state.evidence, ['test-output', 'independent-check', 'persistence-check', 'completion-check']);
});

test('illegal transitions are rejected', () => {
  const state = createExecutionState({ id:'run-3', project:'agent-skills', frontierId:'frontier-3', phase:'DISCOVERED' });
  assert.throws(() => transitionExecution(state, 'COMPLETED'), /execution_transition_not_allowed/);
});
