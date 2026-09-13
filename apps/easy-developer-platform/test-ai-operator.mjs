import assert from 'node:assert/strict';
import { execute, plan } from './ai-operator.mjs';

const p=plan('inspect and verify this workspace');
assert.equal(p.mode,'fail-closed');
assert.ok(p.steps.includes('guardian_scan'));

const safe=await execute('inspect and verify this workspace',{workspace:'.'});
assert.equal(safe.status,'VERIFIED');
assert.ok(safe.evidence.some(x=>x.step==='guardian_scan'));
assert.ok(safe.evidence.some(x=>x.step==='syntax_verification'));

const risky=await execute('deploy to production',{workspace:'.'});
assert.equal(risky.status,'BLOCKED');
assert.equal(risky.summary,'High-risk action requires explicit approval');

console.log('AI Operator kernel proof: PASS');
