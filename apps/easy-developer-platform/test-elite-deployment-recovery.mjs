import assert from 'node:assert/strict';
import { classifyDeploymentFailure, parseJsonLines } from './elite-deployment-recovery.mjs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function runNodeCheck(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--check', file]);
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => resolve({ code, stderr }));
  });
}

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

const recoveryPath = new URL('./elite-deployment-recovery.mjs', import.meta.url);
const recoveryCheck = await runNodeCheck(recoveryPath);
assert.equal(recoveryCheck.code, 0, `elite-deployment-recovery.mjs must remain syntactically valid: ${recoveryCheck.stderr}`);

console.log('elite-deployment-recovery tests passed');
