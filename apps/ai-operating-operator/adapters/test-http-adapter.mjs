import assert from 'node:assert/strict';
import {runHttp} from './http-adapter.mjs';
await assert.rejects(()=>runHttp({url:'http://example.com'}),/https_required/);
await assert.rejects(()=>runHttp({url:'https://example.com'}),/http_host_not_allowlisted/);
console.log('http-adapter tests: ok');
