import assert from 'node:assert/strict';

const source = await (await import('node:fs/promises')).readFile(new URL('./affiliate-live-bridge.mjs', import.meta.url), 'utf8');
assert.match(source, /\/api\/revenue\/mony\/workbench/);
assert.match(source, /\/api\/revenue\/mony\/work/);
assert.match(source, /EASY_OPENAI_API_KEY/);
assert.match(source, /gpt-4\.1-mini/);
assert.match(source, /retry-after/);
assert.match(source, /rate_limited/);
assert.match(source, /partnerTrackingUrl/);
assert.match(source, /Product Content/);
assert.match(source, /Voice Studio/);
assert.match(source, /Client Offer/);
console.log('mony-workbench: contract tests passed');
