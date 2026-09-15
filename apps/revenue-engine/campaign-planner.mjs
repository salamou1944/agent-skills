import { OFFER_CATALOG, TARGET_MARKETS } from './market-strategy.mjs';

const DEFAULT_CHANNELS = Object.freeze(['youtube', 'seo', 'short_video', 'community_content']);

export function buildLaunchCampaign({ offerId = 'elevenlabs-affiliate', marketCodes = ['US', 'GB', 'CA'], channels = DEFAULT_CHANNELS } = {}) {
  const offer = OFFER_CATALOG.find((item) => item.id === offerId);
  if (!offer) throw new Error(`unknown_offer:${offerId}`);
  const markets = TARGET_MARKETS.filter((market) => marketCodes.includes(market.code) && offer.marketFit.includes(market.code));
  if (!markets.length) throw new Error('no_eligible_markets');
  return {
    id: `campaign_${offer.id}`,
    status: 'activation_pending',
    offer: {
      id: offer.id,
      provider: offer.provider,
      officialSource: offer.source,
      terms: offer.terms,
      tracking: 'provider_unique_tracking_link_required'
    },
    markets: markets.map((market) => ({ code: market.code, country: market.country, language: market.language, priority: market.priority })),
    channels: [...channels],
    assets: [
      'problem-solution article',
      'short-form demonstration',
      'long-form tutorial/review',
      'comparison/decision page'
    ],
    funnel: ['content', 'disclosed CTA', 'tracking link', 'provider landing page', 'conversion', 'confirmed commission'],
    gates: [
      'affiliate_account_approved',
      'tracking_link_verified',
      'disclosure_present',
      'provider_terms_verified',
      'content_quality_checked'
    ],
    metrics: ['impressions', 'clicks', 'CTR', 'registrations', 'paid_conversions', 'confirmed_commission'],
    optimization: { minimum_signal: 'provider_confirmed_conversion', action: 'scale_winners_and_stop_losers' },
    revenueRule: 'confirmed_provider_event_only'
  };
}

export function buildLaunchTable() {
  return [
    { rank: 1, market: 'US', offer: 'ElevenLabs', action: 'activate account + obtain tracking link', status: 'blocked_on_user_account' },
    { rank: 2, market: 'GB', offer: 'ElevenLabs', action: 'reuse English asset set', status: 'queued_after_activation' },
    { rank: 3, market: 'CA', offer: 'ElevenLabs', action: 'reuse English asset set', status: 'queued_after_activation' },
    { rank: 4, market: 'US', offer: 'Hostinger', action: 'activate affiliate account + obtain tracking link', status: 'queued' },
    { rank: 5, market: 'GB', offer: 'Hostinger', action: 'reuse high-performing asset pattern', status: 'queued' },
    { rank: 6, market: 'US', offer: 'Payoneer', action: 'submit partner application', status: 'queued' }
  ];
}
