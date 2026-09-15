export const TARGET_MARKETS = Object.freeze([
  { country: 'United States', code: 'US', region: 'Americas', priority: 100, language: 'en', currency: 'USD' },
  { country: 'Canada', code: 'CA', region: 'Americas', priority: 90, language: 'en', currency: 'CAD' },
  { country: 'United Kingdom', code: 'GB', region: 'Europe', priority: 95, language: 'en', currency: 'GBP' },
  { country: 'Germany', code: 'DE', region: 'Europe', priority: 90, language: 'de', currency: 'EUR' },
  { country: 'France', code: 'FR', region: 'Europe', priority: 85, language: 'fr', currency: 'EUR' },
  { country: 'Netherlands', code: 'NL', region: 'Europe', priority: 80, language: 'nl', currency: 'EUR' },
  { country: 'Sweden', code: 'SE', region: 'Europe', priority: 75, language: 'sv', currency: 'SEK' },
  { country: 'Norway', code: 'NO', region: 'Europe', priority: 75, language: 'no', currency: 'NOK' },
  { country: 'Denmark', code: 'DK', region: 'Europe', priority: 75, language: 'da', currency: 'DKK' },
  { country: 'Finland', code: 'FI', region: 'Europe', priority: 70, language: 'fi', currency: 'EUR' },
  { country: 'Switzerland', code: 'CH', region: 'Europe', priority: 70, language: 'de', currency: 'CHF' },
  { country: 'Austria', code: 'AT', region: 'Europe', priority: 70, language: 'de', currency: 'EUR' },
  { country: 'Ireland', code: 'IE', region: 'Europe', priority: 70, language: 'en', currency: 'EUR' },
  { country: 'Spain', code: 'ES', region: 'Europe', priority: 65, language: 'es', currency: 'EUR' },
  { country: 'Italy', code: 'IT', region: 'Europe', priority: 65, language: 'it', currency: 'EUR' },
  { country: 'Belgium', code: 'BE', region: 'Europe', priority: 65, language: 'fr', currency: 'EUR' }
]);

export const OFFER_CATALOG = Object.freeze([
  {
    id: 'elevenlabs-affiliate',
    provider: 'ElevenLabs',
    type: 'affiliate',
    source: 'https://elevenlabs.io/affiliate-partner-guide',
    terms: 'https://elevenlabs.io/affiliates-terms',
    commission: '22% for Starter/Creator/Pro/Scale payments for first 12 months; 11% Business',
    audience: ['creators', 'video-makers', 'podcasters', 'developers', 'businesses'],
    marketFit: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'IE', 'ES', 'IT', 'BE'],
    activation: 'requires_approved_partner_account_and_unique_tracking_link',
    rank: 1
  },
  {
    id: 'hostinger-affiliate',
    provider: 'Hostinger',
    type: 'affiliate',
    source: 'https://www.hostinger.com/affiliates',
    terms: 'https://www.hostinger.com/support/1583263-how-to-join-the-hostinger-affiliate-program/',
    commission: 'starts at 40% per eligible sale; current terms should be checked before publishing',
    audience: ['website-builders', 'developers', 'small-businesses', 'affiliate-marketers'],
    marketFit: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'IE', 'ES', 'IT', 'BE'],
    activation: 'requires_approved_affiliate_account_and_unique_tracking_link',
    rank: 2
  },
  {
    id: 'payoneer-affiliate',
    provider: 'Payoneer',
    type: 'affiliate',
    source: 'https://www.payoneer.com/affiliate-program/',
    terms: 'https://www.payoneer.com/affiliate-program/',
    commission: 'commission is based on referred active customers; exact current rate requires program approval',
    audience: ['freelancers', 'agencies', 'exporters', 'global-businesses'],
    marketFit: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'IE', 'ES', 'IT', 'BE'],
    activation: 'requires_partner_application_and_tracking_link',
    rank: 3
  }
]);

export function selectOffers({ marketCodes = TARGET_MARKETS.map((m) => m.code), audience = [] } = {}) {
  const markets = new Set(marketCodes);
  const wanted = new Set(audience);
  return OFFER_CATALOG
    .filter((offer) => offer.marketFit.some((code) => markets.has(code)))
    .map((offer) => ({
      ...offer,
      audienceMatch: wanted.size === 0 ? 1 : offer.audience.filter((x) => wanted.has(x)).length / wanted.size,
      marketCoverage: offer.marketFit.filter((code) => markets.has(code)).length
    }))
    .sort((a, b) => a.rank - b.rank || b.marketCoverage - a.marketCoverage);
}

export function buildCampaignPlan({ offer, markets = TARGET_MARKETS, channels = ['search_content', 'youtube', 'short_video', 'community_content'] } = {}) {
  if (!offer) throw new Error('offer_required');
  const selectedMarkets = markets.filter((m) => offer.marketFit.includes(m.code));
  return {
    offerId: offer.id,
    provider: offer.provider,
    markets: selectedMarkets.map((m) => ({ code: m.code, country: m.country, language: m.language, priority: m.priority })),
    channels,
    sequence: [
      'publish_disclosed_problem_solution_content',
      'route_to_provider_tracking_link_after_approval',
      'measure_clicks_and_confirmed_conversions',
      'kill_low_signal_variants',
      'scale_high_signal_markets_and_topics'
    ],
    compliance: ['affiliate_disclosure', 'no_spam', 'no_self_referral', 'no_fake_accounts', 'no_guaranteed_income_claims'],
    revenueRule: 'count_only_provider_confirmed_commissions'
  };
}
