import assert from 'node:assert/strict';
import {verifyWorkspaceResult} from './adapters/workspace-adapter.mjs';
const ok=verifyWorkspaceResult({action:'snapshot',result:{executionId:'x',result:{status:200}}});
assert.equal(ok.passed,true);
const bad=verifyWorkspaceResult({action:'snapshot',result:{executionId:'',result:{status:200}}});
assert.equal(bad.passed,false);
console.log('workspace adapter contract PASS');
