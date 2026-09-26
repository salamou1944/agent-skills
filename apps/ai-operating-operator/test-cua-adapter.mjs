import assert from 'node:assert/strict';
import {runCua} from './adapters/cua-adapter.mjs';
import {verifyCuaResult} from './verifiers/cua-verifier.mjs';

process.env.OPERATOR_CUA_URL='https://cua.invalid';
await assert.rejects(()=>runCua({action:'list_apps',task:{taskId:'t',allowedActions:[]}},process.env),/cua_read_not_authorized/);
const verified=verifyCuaResult({result:{executionId:'e',action:'health',status:200,ok:true}});
assert.equal(verified.passed,true);
const unsafe=verifyCuaResult({result:{executionId:'e',action:'click',status:200,ok:true}});
assert.equal(unsafe.passed,false);
console.log('cua adapter/verifier contract tests: PASS');
