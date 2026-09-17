import { createEngine } from './revenue-engine.mjs';
import { createRevenueApi } from './revenue-api.mjs';
import { createElevenLabsAffiliateAdapter } from './elevenlabs-affiliate-adapter.mjs';
import { createHostingerAffiliateAdapter, createPayoneerAffiliateAdapter } from './secondary-affiliate-adapters.mjs';
import { createLiveProviderRegistry } from './live-provider-adapters.mjs';
import { createServer } from 'node:http';

const requestedMode = process.env.REVENUE_ENGINE_MODE || 'dry-run';
const allowedModes = new Set(['dry-run', 'live']);
if (!allowedModes.has(requestedMode)) throw new Error(`invalid_revenue_engine_mode:${requestedMode}`);
const providerNames = { discovery:'REVENUE_DISCOVERY_PROVIDER', affiliate:'REVENUE_AFFILIATE_PROVIDER', publishing:'REVENUE_PUBLISH_PROVIDER', billing:'REVENUE_BILLING_PROVIDER', analytics:'REVENUE_ANALYTICS_PROVIDER' };
const AFFILIATE_EVIDENCE_LADDER = Object.freeze(['configured','reachable','click_observed','signup_observed','conversion_observed','commission_confirmed','payout_confirmed']);
function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
function providerState() { return Object.fromEntries(Object.entries(providerNames).map(([key, env]) => [key, Boolean(process.env[env]) || Boolean(process.env[`REVENUE_${key.toUpperCase()}_URL`)])); }
function missingProviders(providers) { return Object.entries(providers).filter(([, configured]) => !configured).map(([key]) => key); }
function createAffiliateProviders() { return { 'elevenlabs-affiliate':createElevenLabsAffiliateAdapter(), 'hostinger-affiliate':createHostingerAffiliateAdapter(), 'payoneer-affiliate':createPayoneerAffiliateAdapter() }; }
function affiliateEvidence(adapter, health) {
  const configured = Boolean(adapter?.configured || health?.ok);
  return { configured, reachable:Boolean(health?.ok), clickObserved:false, signupObserved:false, conversionObserved:false, commissionConfirmed:false, payoutConfirmed:false, level:health?.ok?'reachable':configured?'configured':'unconfigured', proof:health?.ok?'adapter health/tracking URL only':'no provider evidence' };
}
function doctor() {
  const providers = providerState(), missing = missingProviders(providers), adapters = Object.values(createAffiliateProviders());
  const livePrerequisites = missing.length ? [`configure_provider_categories:${missing.join(',')}`,'run_revenue:provider-health','collect_provider_integration_evidence','record_confirmed_provider_event'] : ['run_revenue:provider-health','collect_provider_integration_evidence','record_confirmed_provider_event'];
  return { ok:requestedMode!=='live', mode:requestedMode, providers, missingProviders:missing, configuredProviders:Object.values(providers).filter(Boolean).length, liveEndpoints:Object.fromEntries(Object.keys(providerNames).map(key=>[key,Boolean(process.env[`REVENUE_${key.toUpperCase()}_URL`])])), affiliateAdapters:adapters.map(adapter=>({name:adapter.name,configured:adapter.configured===true || (adapter.name==='elevenlabs-affiliate'?Boolean(process.env.ELEVENLABS_AFFILIATE_LINK):adapter.name==='hostinger-affiliate'?Boolean(process.env.HOSTINGER_AFFILIATE_LINK):Boolean(process.env.PAYONEER_AFFILIATE_LINK))})), activation:requestedMode==='live'?'requires-live-provider-health-and-confirmed-event':'dry-run-ready', activationReady:false, nextAction:requestedMode==='live'?livePrerequisites[0]:'use_dry_run_or_fixture_boundaries_until_live_evidence_exists', livePrerequisites, affiliateEvidenceLadder:[...AFFILIATE_EVIDENCE_LADDER], rule:'Provider configuration/reachability is not attribution or revenue evidence; claims require provider-originated events at the corresponding evidence level.' };
}
async function providerHealth() { const providers=createLiveProviderRegistry(), result={}; for(const [category,adapter] of Object.entries(providers)) result[category]=await adapter.healthCheck(); return {ok:Object.values(result).every(item=>item.ok),providers:result}; }
async function liveProbe() { const providers=createLiveProviderRegistry(), result={}; for(const [category,adapter] of Object.entries(providers)){const health=await adapter.healthCheck();result[category]={...health,endpointConfigured:adapter.configured};} const configured=Object.values(result).filter(item=>item.endpointConfigured); return {ok:configured.length>0&&configured.every(item=>item.ok),mode:'live-probe',configuredCategories:configured.length,providers:result,revenueRecorded:false,rule:'A live probe verifies reachability only; it never fabricates or records revenue.'}; }
async function affiliateStatus() { const adapters=Object.values(createAffiliateProviders()), status=[]; for(const adapter of adapters){const health=await adapter.healthCheck(), evidence=affiliateEvidence(adapter,health); status.push({provider:adapter.name,health,trackingUrlPresent:evidence.reachable,evidence});} return {ok:status.some(item=>item.evidence.reachable),revenueConfirmed:false,attributionConfirmed:false,affiliateEvidenceLadder:[...AFFILIATE_EVIDENCE_LADDER],affiliates:status,rule:'Configured/reachable affiliate links do not prove clicks, signups, conversions, commissions, or payouts.'}; }
async function assertLiveActivation() { const providers=providerState(), missing=missingProviders(providers); if(missing.length) throw new Error(`live_activation_blocked:missing_providers:${missing.join(',')}`); const health=await providerHealth(); if(!health.ok) throw new Error(`live_activation_blocked:provider_health:${Object.entries(health.providers).filter(([,item])=>!item.ok).map(([key,item])=>`${key}:${item.reason||item.status||item.httpStatus}`).join(',')}`); if(!process.env.REVENUE_WEBHOOK_SECRET) throw new Error('live_activation_blocked:missing_REVENUE_WEBHOOK_SECRET'); return health; }
function demo() { const engine=createEngine({mode:'dry-run',providers:createAffiliateProviders()}); const opportunity=engine.discover({title:'Example verified developer productivity offer',source:'https://example.com/offer',description:'Deterministic demonstration only; not a live offer.'}); const verified=engine.verify(opportunity,{sourceReachable:true,offerExists:true,termsKnown:true,payoutKnown:true,identityKnown:true}); const scored=engine.score(verified,{revenuePotential:90,commission:85,demand:82,competition:35,automation:95,longevity:80,payout:90,risk:10}); const plan=engine.plan(scored); return {opportunity:scored,plan,assets:engine.fanOut(scored,plan)}; }
const command=process.argv[2]||'doctor';
if(command==='doctor') print(doctor());
else if(command==='provider-health') print(await providerHealth());
else if(command==='live-probe') print(await liveProbe());
else if(command==='affiliate-status') print(await affiliateStatus());
else if(command==='demo') print(demo());
else if(command==='serve'){if(requestedMode==='live') await assertLiveActivation(); const engine=createEngine({mode:requestedMode,providers:createProviders()}); const port=Number(process.env.REVENUE_ENGINE_PORT||8787); createServer(createRevenueApi({engine})).listen(port,'127.0.0.1',()=>console.log(`revenue-engine ready on 127.0.0.1:${port} (${requestedMode})`));}
else { console.error(`unknown_command:${command}`); process.exitCode=2; }
