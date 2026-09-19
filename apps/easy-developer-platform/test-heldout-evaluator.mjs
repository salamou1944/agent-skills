import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { evaluateHeldOutEvidence } from './heldout-evaluator.mjs';

const workspace = mkdtempSync(tmpdir() + '/heldout-evaluator-');
execFileSync('git',['init','-q'],{cwd:workspace});
execFileSync('git',['config','user.email','test@example.invalid'],{cwd:workspace});
execFileSync('git',['config','user.name','heldout-test'],{cwd:workspace});
writeFileSync(workspace + '/seed.txt','seed\n');
execFileSync('git',['add','.'],{cwd:workspace});
execFileSync('git',['commit','-qm','seed'],{cwd:workspace});
const baseline = execFileSync('git',['rev-parse','HEAD'],{cwd:workspace,encoding:'utf8'}).trim();

const good = evaluateHeldOutEvidence({workspace,evidence:{baseline_revision:baseline,candidate_id:'candidate-a',candidate_diff_hash:'a'.repeat(64),deterministic_tests_passed:true,adversarial_checks_passed:true,independent_replay_passed:true}});
assert.equal(good.status,'HELDOUT_VERIFIED');
assert.match(good.evaluatorHash,/^[a-f0-9]{64}$/);

const bad = evaluateHeldOutEvidence({workspace,evidence:{baseline_revision:baseline,candidate_id:'candidate-b',candidate_diff_hash:'b'.repeat(64),deterministic_tests_passed:true,adversarial_checks_passed:true,independent_replay_passed:false}});
assert.equal(bad.status,'REJECTED');
assert.equal(bad.reason,'heldout_acceptance_failed');
console.log('heldout-evaluator: passed');
