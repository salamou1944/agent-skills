#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createSupervisorState } from './supervisor-state-machine.mjs';
import { detectOwnershipConflicts } from './army-14-ownership.mjs';
import { evidenceLevel, assertEvidenceForClaim, createEvidenceEvent } from './evidence-ledger.mjs';
import { backoffMs, classifyProviderError, createCircuitBreaker } from './provider-resilience.mjs';

const s = createSupervisorState({ maxRepairs: 1 });
assert.equal(s.state, 'DISCOVER');
s.transition('PLAN'); s.transition('ASSIGN'); s.transition('EXECUTE'); s.transition('VERIFY'); s.transition('REPAIR'); s.transition('REVERIFY');
assert.equal(s.repairs, 1);
assert.equal(s.transition('REPAIR'), 'FAILED');
assert.equal(s.state, 'FAILED');
assert.equal(s.history.at(-1).reason, 'repair_budget_exhausted');

const conflicts = detectOwnershipConflicts([{ soldier:'Builder', paths:['src/a.js'] }, { soldier:'Test-QA', paths:['src/a.js'] }]);
assert.ok(conflicts.length >= 1);
assert.ok(conflicts.some(item => item.path === 'src/a.js'));

const event = createEvidenceEvent({ subject:'affiliate:x', level:'reachable', source:'adapter-health' });
assert.equal(evidenceLevel([event]), 'reachable');
assert.throws(() => assertEvidenceForClaim([event], 'commission_confirmed'), /insufficient_evidence/);
assert.equal(classifyProviderError({ status:429 }), 'rate_limited_or_quota');
assert.equal(classifyProviderError({ status:503 }), 'transient_server');
assert.ok(backoffMs(1, 100) >= 100);
const breaker = createCircuitBreaker({ failureThreshold:2, cooldownMs:1000 });
breaker.recordFailure(); breaker.recordFailure(); assert.equal(breaker.state().opened, true);
console.log(JSON.stringify({ ok:true, controls:['truth','state-machine','ownership','evidence-ladder','provider-resilience'] }));
