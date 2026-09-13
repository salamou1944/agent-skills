import assert from 'node:assert/strict';
import { scanFiles } from '../tools/code-guardian.mjs';

const safe = scanFiles([{ path: 'ok.mjs', content: 'export const answer = 42;\n' }]);
assert.equal(safe.status, 'guarded');
assert.equal(safe.failClosed, true);
assert.equal(safe.findings.length, 0);

const syntax = scanFiles([{ path: 'bad.mjs', content: 'export const = ;\n' }]);
assert.equal(syntax.status, 'blocked');
assert.ok(syntax.findings.some((x) => x.rule === 'syntax-error'));

const secret = scanFiles([{ path: 'secret.mjs', content: 'const api_key = "1234567890abcdef";\n' }]);
assert.equal(secret.status, 'blocked');
assert.ok(secret.findings.some((x) => x.severity === 'critical'));
assert.ok(!JSON.stringify(secret).includes('1234567890abcdef'));

const unsafe = scanFiles([{ path: '../escape.mjs', content: 'x' }]);
assert.equal(unsafe.status, 'blocked');
assert.ok(unsafe.findings.some((x) => x.rule === 'unsafe-path'));

console.log('code-guardian self-test: PASS');
