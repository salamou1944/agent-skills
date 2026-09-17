import assert from 'node:assert/strict';
import { TASKS } from './project-queue-orchestrator.mjs';
import { SOLDIER_SYSTEMS } from './soldier-systems/army-14-systems.mjs';

assert.equal(SOLDIER_SYSTEMS.length, 14);
assert.ok(TASKS.length > 0);
assert.ok(TASKS.some((task) => task.phase === 'mony'));
assert.ok(TASKS.some((task) => task.phase === 'easy'));
assert.ok(TASKS.every((task) => typeof task.id === 'string' && typeof task.scope === 'string'));

const sample = Object.fromEntries(TASKS.map((task, index) => [task.id, { status: index === 0 ? 'VERIFIED' : index === 1 ? 'NOOP' : 'PENDING' }]));
const verified = Object.values(sample).filter((entry) => entry.status === 'VERIFIED').length;
const noop = Object.values(sample).filter((entry) => entry.status === 'NOOP').length;
assert.equal(verified, 1);
assert.equal(noop, 1);
assert.equal(Math.round((verified / TASKS.length) * 10000) / 100, Number((1 / TASKS.length * 100).toFixed(2)));
assert.equal(Math.round(((verified + noop) / TASKS.length) * 10000) / 100, Number((2 / TASKS.length * 100).toFixed(2)));
console.log(JSON.stringify({ ok: true, soldiers: SOLDIER_SYSTEMS.length, tasks: TASKS.length, monitor: 'build-monitor-v1' }));
