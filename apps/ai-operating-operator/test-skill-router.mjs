import assert from 'node:assert/strict';
import {createTask} from './operator-core.mjs';
import {loadSkillRegistry,routeIntent,buildExecutionPlan} from './skill-router.mjs';

const r=await loadSkillRegistry();
assert.equal(r.registeredCount,80);
assert.ok(r.skillIds.includes('evidence-backed-operator'));
assert.ok(r.skillIds.includes('browser-presence-operator'));

const routed=routeIntent('fix EASY deployment failure and verify Railway',r.skillIds);
assert.ok(routed.selected.includes('failure-recovery-operator'));
assert.ok(routed.selected.includes('evidence-backed-operator'));

const task=createTask({project:'agent-skills',goal:'run authorized nmap security scan',requestedCapabilities:['security.network.nmap']});
const blocked=await buildExecutionPlan(task,{capabilities:{'security.network.nmap':{authorized:true,reachable:false}},adapters:{}});
assert.equal(blocked.executionAllowed,false);
assert.equal(blocked.capabilities[0].status,'BLOCKED_EXTERNAL_DEPENDENCY');

const ready=await buildExecutionPlan(task,{capabilities:{'security.network.nmap':{authorized:true,reachable:true}},adapters:{'security.network.nmap':{status:'ADAPTER_READY'}}});
assert.equal(ready.executionAllowed,true);
console.log('skill-router tests: PASS');
