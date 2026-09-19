import assert from 'node:assert/strict';
import { createElevenLabsAffiliateAdapter, elevenLabsAffiliateStatus } from './elevenlabs-affiliate-adapter.mjs';

const disabled = createElevenLabsAffiliateAdapter({ trackingLink: '' });
assert.equal((await disabled.healthCheck()).ok, false);
await assert.rejects(() => disabled.execute(), /provider_unavailable:elevenlabs-affiliate/);

const configured = createElevenLabsAffiliateAdapter({ trackingLink: 'https://example.test/affiliate/abc' });
const configuredHealth = await configured.healthCheck();
assert.equal(configuredHealth.ok, true);
assert.equal(configuredHealth.status, 'ready');
assert.equal(configuredHealth.provider, 'ElevenLabs');
assert.equal(configuredHealth.tracking, 'configured');
assert.equal(configuredHealth.trackingUrlContract, 'https-url');
assert.equal((await configured.execute()).trackingUrl, 'https://example.test/affiliate/abc');
assert.equal(elevenLabsAffiliateStatus({ trackingLink: 'https://example.test/affiliate/abc' }).configured, true);

console.log('elevenlabs-affiliate-adapter: all tests passed');
