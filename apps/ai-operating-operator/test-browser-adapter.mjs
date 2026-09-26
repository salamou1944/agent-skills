import assert from 'node:assert/strict';
import {verifyBrowserResult} from './adapters/browser-adapter.mjs';
const ok={executionId:'x',result:{ok:true,status:200}};
assert.equal(verifyBrowserResult({result:ok,action:'health'}).passed,true);
assert.equal(verifyBrowserResult({result:ok,action:'click'}).passed,false);
console.log('browser adapter tests: PASS');
