import { assertProviderAdapter } from './provider-contract.mjs';

const ENV_KEY = 'ELEVENLABS_AFFILIATE_LINK';

export function createElevenLabsAffiliateAdapter({ trackingLink = process.env[ENV_KEY] } = {}) {
  const link = String(trackingLink || '').trim();
  const configured = /^https:\/\//i.test(link);
  const adapter = {
    name: 'elevenlabs-affiliate',
    capabilities: ['affiliate_tracking', 'campaign_attribution'],
    async healthCheck() {
      if (!configured) return { ok: false, status: 'provider-unavailable', reason: 'affiliate_link_not_configured', env: ENV_KEY };
      return { ok: true, status: 'ready', provider: 'ElevenLabs', tracking: 'configured' };
    },
    async execute({ action = 'tracking_url' } = {}) {
      if (!configured) throw new Error('provider_unavailable:elevenlabs-affiliate');
      if (action !== 'tracking_url') throw new Error(`unsupported_action:${action}`);
      return { provider: 'ElevenLabs', trackingUrl: link };
    }
  };
  assertProviderAdapter(adapter);
  return Object.freeze(adapter);
}

export function elevenLabsAffiliateStatus({ trackingLink = process.env[ENV_KEY] } = {}) {
  const link = String(trackingLink || '').trim();
  return { configured: /^https:\/\//i.test(link), env: ENV_KEY, provider: 'ElevenLabs', neverExposeSecret: true };
}
