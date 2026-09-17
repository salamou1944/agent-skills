import { assertProviderAdapter } from './provider-contract.mjs';

const ENV_KEY = 'ELEVENLABS_AFFILIATE_LINK';

function normalizeTrackingUrl(value) {
  const link = String(value || '').trim();
  if (!link) return '';
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function createElevenLabsAffiliateAdapter({ trackingLink = process.env[ENV_KEY] } = {}) {
  const link = normalizeTrackingUrl(trackingLink);
  const configured = Boolean(link);
  const adapter = {
    name: 'elevenlabs-affiliate',
    capabilities: ['affiliate_tracking', 'campaign_attribution'],
    async healthCheck() {
      if (!configured) return { ok: false, status: 'provider-unavailable', reason: 'affiliate_link_not_configured_or_invalid', env: ENV_KEY };
      return { ok: true, status: 'ready', provider: 'ElevenLabs', tracking: 'configured', trackingUrlContract: 'https-url' };
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
  return { configured: Boolean(normalizeTrackingUrl(trackingLink)), env: ENV_KEY, provider: 'ElevenLabs', neverExposeSecret: true, trackingUrlContract: 'https-url' };
}
