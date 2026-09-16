import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const file = 'apps/revenue-engine/revenue-operator.mjs';

const doctor = JSON.parse(execFileSync(process.execPath, [file, 'doctor'], { encoding: 'utf8' }));
assert.equal(doctor.mode, 'dry-run');
assert.equal(doctor.activation, 'dry-run-ready');
assert.equal(doctor.activationReady, false);
assert.ok(Array.isArray(doctor.missingProviders));
assert.ok(Array.isArray(doctor.livePrerequisites));
assert.equal(doctor.nextAction, 'use_dry_run_or_fixture_boundaries_until_live_evidence_exists');
assert.match(doctor.rule, /provider variable alone never activates production/i);

const demo = JSON.parse(execFileSync(process.execPath, [file, 'demo'], { encoding: 'utf8' }));
assert.equal(demo.opportunity.status, 'approved_for_build');
assert.ok(demo.plan.primary);
assert.equal(demo.assets.length, 5);

let failed = false;
try {
  execFileSync(process.execPath, [file, 'serve'], {
    encoding: 'utf8',
    env: { ...process.env, REVENUE_ENGINE_MODE: 'live', REVENUE_ENGINE_PORT: '0' }
  });
} catch (error) {
  failed = true;
  const output = `${error.stdout || ''}${error.stderr || ''}`;
  assert.match(output, /live_activation_blocked/);
}
assert.equal(failed, true, 'live mode must fail closed without real provider adapters');

console.log('revenue-operator: all activation tests passed');
