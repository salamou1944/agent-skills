import { assertProviderAdapter } from './provider-contract.mjs';

function createLinkAdapter({ name, provider, envName }) {
  const adapter = {
    name,
    capabilities: ['tracking_url'],
    async healthCheck() {
      const trackingUrl = process.env[envName];
      if (!trackingUrl) return { ok: false, status: 'provider-unavailable', provider, tracking: 'missing' };
      if (!trackingUrl.startsWith('https://')) return { ok: false, status: 'provider-invalid', provider, tracking: 'invalid' };
      return { ok: true, status: 'ready', provider, tracking: 'configured' };
    },
    async execute({ action } = {}) {
      if (action !== 'tracking_url') throw new Error(`unsupported_action:${action}`);
      const trackingUrl = process.env[envName];
      if (!trackingUrl) throw new Error(`tracking_url_missing:${name}`);
      if (!trackingUrl.startsWith('https://')) throw new Error(`tracking_url_invalid:${name}`);
      return { provider, trackingUrl };
    }
  };
  assertProviderAdapter(adapter);
  return adapter;
}

export function createHostingerAffiliateAdapter() {
  return createLinkAdapter({ name: 'hostinger-affiliate', provider: 'Hostinger', envName: 'HOSTINGER_AFFILIATE_LINK' });
}

export function createPayoneerAffiliateAdapter() {
  return createLinkAdapter({ name: 'payoneer-affiliate', provider: 'Payoneer', envName: 'PAYONEER_AFFILIATE_LINK' });
}
