import assert from 'node:assert/strict';
import { createElevenLabsAffiliateAdapter, elevenLabsAffiliateStatus } from './elevenlabs-affiliate-adapter.mjs';

const disabled = createElevenLabsAffiliateAdapter({ trackingLink: '' });
assert.equal((await disabled.healthCheck()).ok, false);
await assert.rejects(() => disabled.execute(), /provider_unavailable:elevenlabs-affiliate/);

const configured = createElevenLabsAffiliateAdapter({ trackingLink: 'https://example.test/affiliate/abc' });
assert.deepEqual(await configured.healthCheck(), { ok: true, status: 'ready', provider: 'ElevenLabs', tracking: 'configured' });
assert.equal((await configured.execute()).trackingUrl, 'https://example.test/affiliate/abc');
assert.equal(elevenLabsAffiliateStatus({ trackingLink: 'https://example.test/affiliate/abc' }).configured, true);

console.log('elevenlabs-affiliate-adapter: all tests passed');
