export const SERVICE_MARKET_SOURCES = Object.freeze([
  { id: 'upwork-june-2026', source: 'Upwork Monthly Hiring Insights — June 2026', url: 'https://www.upwork.com/research/upwork-monthly-hiring-report-june-2026', evidence: { aiAppsIntegrationMoM: 34, aiAppsIntegrationYoY: 33, crmErpMoM: 13, leadGenerationMoM: 9, qaTestingSmbMoM: 20 } },
  { id: 'upwork-2026-skills', source: 'Upwork In-Demand Skills 2026', url: 'https://www.upwork.com/press/releases/upworks-in-demand-skills-2026-demand-for-top-ai-skills-more-than-doubles', evidence: { aiEnabledSkillsYoY: 109, aiIntegrationYoY: 178, aiChatbotDevelopmentYoY: 71, ecommerceManagementYoY: 130, aiVideoGenerationEditingYoY: 329, aiImageGenerationEditingYoY: 95, socialMediaStrategyYoY: 36, scriptingAutomationInTopTen: true } },
  { id: 'fiverr-june-2026', source: 'Fiverr Business Trends Index — June 2026', url: 'https://www.fiverr.com/resources/guides/reports/business-trends-index-june-2026', evidence: { aiVideoAnimationSearchGrowth: 278, shortFormVideoEditingGrowth: 27, videoEditingGrowth: 36, excelDataCleaningGrowth: 210, pdfToExcelGrowth: 153, aiVoiceAgentsGrowth: 49, aiMobileAppDevelopmentGrowth: 92, aiWebsiteDevelopmentGrowth: 39 } },
  { id: 'smb-ai-adoption', source: 'Federal Reserve Bank of San Francisco — AI Adoption Among Small Businesses', url: 'https://www.frbsf.org/research-and-insights/publications/community-development-research-briefs/2026/07/ai-adoption-in-small-businesses-2024-sbcs/', evidence: { usingOrPlanningAI: 40, commonUses: ['productivity', 'marketing', 'seo', 'visuals', 'customer_service', 'analytics', 'programming'] } }
]);

export const SERVICE_OFFERS = Object.freeze([
  {
    id: 'ai-workflow-automation', name: 'AI Workflow Automation Sprint',
    demandSignals: ['ai-integration', 'scripting-automation', 'crm', 'lead-generation', 'workflow-automation'],
    buyers: ['founder', 'operations-manager', 'sales-operations-manager', 'agency-owner', 'ecommerce-operator'],
    companyProfile: ['5-200 employees', 'already uses SaaS tools', 'repetitive manual workflow', 'measurable operational bottleneck'],
    triggers: ['manual lead routing', 'copying data between apps', 'CRM cleanup', 'report generation', 'customer follow-up'],
    packages: [
      { id: 'audit', price: 149, deliverable: 'workflow map + automation specification' },
      { id: 'sprint', price: 750, deliverable: 'one production-ready workflow integration' },
      { id: 'managed', price: 1500, deliverable: 'multiple workflows + monitoring handoff' }
    ],
    buildStatus: 'specification_ready', fulfillmentBoundary: 'requires integration implementation and provider credentials supplied by the client'
  },
  {
    id: 'ecommerce-listing-optimization', name: 'AI Ecommerce Listing Optimization',
    demandSignals: ['ecommerce-management', 'ai-content', 'shopify', 'product-copy'],
    buyers: ['ecommerce-founder', 'shopify-store-owner', 'marketplace-manager', 'ecommerce-agency'],
    companyProfile: ['20+ SKUs', 'Shopify or marketplace catalog', 'weak/inconsistent product copy'],
    triggers: ['catalog expansion', 'new product launch', 'low conversion', 'manual listing backlog'],
    packages: [
      { id: 'sample', price: 0, deliverable: 'one free listing sample' },
      { id: 'starter', price: 79, deliverable: '20 optimized listings' },
      { id: 'scale', price: 249, deliverable: '100 optimized listings' }
    ],
    buildStatus: 'implemented', fulfillmentBoundary: 'uses the canonical product-listing-sales service over Salamou-31'
  },
  {
    id: 'ai-video-repurposing', name: 'AI Video Repurposing Pack',
    demandSignals: ['ai-video', 'short-form-video', 'video-editing', 'youtube'],
    buyers: ['creator', 'podcaster', 'coach', 'agency-owner', 'small-business-marketer'],
    companyProfile: ['existing long-form video library', 'publishes on YouTube/podcast/webinar channels'],
    triggers: ['weekly content backlog', 'need for shorts', 'launch campaign', 'content repurposing'],
    packages: [
      { id: 'pilot', price: 199, deliverable: '10 short-form edits from supplied source footage' },
      { id: 'growth', price: 499, deliverable: '30 short-form edits + titles/hooks' }
    ],
    buildStatus: 'market_validated_build_queue', fulfillmentBoundary: 'do not sell as fully automated until a verified video production adapter exists'
  }
]);

export function rankServices() {
  const score = (service) => {
    const signals = new Set(service.demandSignals);
    let value = 0;
    if (signals.has('ai-integration')) value += 40;
    if (signals.has('ai-video')) value += 35;
    if (signals.has('ecommerce-management')) value += 30;
    if (signals.has('lead-generation')) value += 15;
    if (signals.has('scripting-automation')) value += 15;
    if (signals.has('crm')) value += 10;
    if (service.buildStatus === 'implemented') value += 20;
    if (service.buildStatus === 'specification_ready') value += 5;
    return value;
  };
  return SERVICE_OFFERS.map((service) => ({ ...service, marketSignalScore: score(service) })).sort((a, b) => b.marketSignalScore - a.marketSignalScore);
}

export function buildTargetProfile(serviceId, { markets = ['US', 'GB', 'CA', 'DE', 'FR', 'NL'] } = {}) {
  const service = SERVICE_OFFERS.find((item) => item.id === serviceId);
  if (!service) throw new Error('service_not_found');
  return { serviceId, markets, buyerTitles: service.buyers, companyProfile: service.companyProfile, buyingTriggers: service.triggers,
    qualificationQuestions: ['What workflow is currently manual or delayed?', 'Which tools are involved?', 'What is the measurable cost or delay?', 'Who owns the workflow?', 'What outcome would make the project worth paying for?'],
    disqualifiers: ['no defined business problem', 'no access to required client systems', 'request for guaranteed revenue', 'credential sharing outside approved channels'] };
}

export function buildProspectingQueries(serviceId, { markets = ['US', 'GB', 'CA', 'DE', 'FR', 'NL'] } = {}) {
  const service = SERVICE_OFFERS.find((item) => item.id === serviceId);
  if (!service) throw new Error('service_not_found');
  return markets.flatMap((market) => service.triggers.slice(0, 3).map((trigger) => ({ market, query: `"${trigger}" "${service.buyers[0]}" AI automation` })));
}
