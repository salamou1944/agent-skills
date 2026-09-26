import assert from 'node:assert/strict';
import {retryDecision} from './retry-policy.mjs';
import {reviewRequired,enforceReview} from './review-gate.mjs';
assert.equal(retryDecision({attempt:0,maxRetries:2,errorClass:'timeout'}).retry,true);
assert.equal(retryDecision({attempt:2,maxRetries:2,errorClass:'timeout'}).retry,false);
assert.equal(reviewRequired({constraints:[]},{action:'read'}).required,false);
assert.equal(reviewRequired({constraints:[]},{action:'deploy'}).required,false);
assert.equal(enforceReview({constraints:['approval-required']},'deploy').state,'REVIEW_REQUIRED');
console.log('background-runtime tests: ok');
