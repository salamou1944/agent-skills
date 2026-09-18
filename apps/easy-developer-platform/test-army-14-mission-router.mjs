import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS } from './project-queue-orchestrator.mjs';
import { routeMission, routeAll } from './army-14-mission-router.mjs';

test('all queue tasks receive a real soldier route', () => {
  const routes=routeAll(TASKS);
  assert.equal(routes.length,TASKS.length);
  for(const route of routes) assert.match(route.soldierId,/^0[1-9]|1[0-4]$/);
});

test('MONY payment work routes to integration', () => {
  const route=routeMission({id:'mony.payment-billing',scope:'payment',goal:'complete payment billing provider integration'});
  assert.equal(route.soldier,'integration');
});

test('EASY creative work routes to builder or AI agent, never an unrelated fallback', () => {
  const route=routeMission({id:'easy.creative-engine',scope:'easy/creative',goal:'complete creative engine provider orchestration'});
  assert.ok(['builder','ai-agent'].includes(route.soldier));
});
