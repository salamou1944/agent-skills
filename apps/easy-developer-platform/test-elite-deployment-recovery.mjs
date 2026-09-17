import assert from 'node:assert/strict';
import { classifyDeploymentFailure, parseJsonLines } from './elite-deployment-recovery.mjs';

assert.deepEqual(parseJsonLines('{"id":"a","status":"FAILED"}\nnot-json\n{"id":"b","status":"SUCCESS"}'), [
  { id: 'a', status: 'FAILED' },
  { id: 'b', status: 'SUCCESS' }
]);

assert.equal(classifyDeploymentFailure('HTTP 429 Too Many Requests from provider'), 'rate_limit');
assert.equal(classifyDeploymentFailure('npm ERR! ERESOLVE unable to resolve dependency tree'), 'dependency');
assert.equal(classifyDeploymentFailure('SyntaxError: Unexpected token export'), 'build');
assert.equal(classifyDeploymentFailure('Application failed to respond on port 8080'), 'startup');
assert.equal(classifyDeploymentFailure('Missing environment variable RAILWAY_TOKEN'), 'configuration');
assert.equal(classifyDeploymentFailure('getaddrinfo ENOTFOUND api.example.com'), 'network');
assert.equal(classifyDeploymentFailure('some unrelated message'), 'unknown');

console.log('elite-deployment-recovery tests passed');
