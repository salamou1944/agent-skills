import assert from 'node:assert/strict';
import { evaluateReleaseEvidence } from './release-gate.mjs';
const base={heldout_status:'HELDOUT_VERIFIED',independent_status:'INDEPENDENTLY_VERIFIED',baseline_revision:'a'.repeat(40),candidate_diff_hash:'b'.repeat(64)};
assert.equal(evaluateReleaseEvidence(base).status,'BLOCKED');
assert.equal(evaluateReleaseEvidence({...base,production_authorization:true}).status,'RELEASE_ELIGIBLE');
assert.equal(evaluateReleaseEvidence({...base,production_authorization:true,candidate_diff_hash:'bad'}).reason,'invalid_candidate_diff_hash');
console.log('release-gate: passed');
