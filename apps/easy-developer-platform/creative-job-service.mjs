import http from 'node:http';
import { fixtureProvider, runCreativeJob } from './creative-orchestrator.mjs';
import { openAICreativeProvider, openAICreativeProviderStatus } from './openai-creative-provider.mjs';
import { localCreativeProvider, localCreativeProviderStatus } from './creative-local-provider.mjs';

const port = Number(process.env.EASY_CREATIVE_JOB_PORT || 8794);
const send = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(data)); };
async function body(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) throw Object.assign(new Error('body_too_large'), {status:413}); } try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('invalid_json'), {status:400}); } }
const selfTestEnabled = () => String(process.env.EASY_CREATIVE_SELF_TEST || '').trim().toLowerCase() === 'true';
const isRecoverableExternalFailure = (result) =>
  result?.status === 'FAILED' && ['provider_credentials_missing','provider_http_401','provider_http_402','provider_http_403','provider_http_429','provider_http_500','provider_http_502','provider_http_503','provider_http_504'].includes(String(result.reason || '').toLowerCase());

export async function runCreativeJobWithFallback(input = {}) {
  const requestedMode = String(input.mode || 'auto').trim().toLowerCase();
  if (requestedMode === 'fixture') return runCreativeJob(input, fixtureProvider());
  if (requestedMode === 'local') return runCreativeJob(input, localCreativeProvider());
  if (requestedMode === 'openai') return runCreativeJob(input, openAICreativeProvider());
  if (requestedMode !== 'auto') return runCreativeJob({ ...input, mode: requestedMode }, null);

  const openai = await runCreativeJob({ ...input, mode: 'openai' }, openAICreativeProvider());
  if (!isRecoverableExternalFailure(openai)) return openai;
  if (!input.asset?.dataUrl && !input.dataUrl) return openai;
  const local = await runCreativeJob({ ...input, mode: 'local' }, localCreativeProvider());
  return Object.freeze({
    ...local,
    fallback: {
      attempted: true,
      from: openai.reason || 'external_provider_failure',
      provider: 'local-safe-presenter',
      externalFailureEvidence: openai.events?.filter(event => event.decision === 'FAILED') || [],
    },
  });
}

const testAsset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAAB/ElEQVR42u3TQQ0AAAjEMMC/2JPAGw20AAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADwLV3WQTQQMB8VgAAAABJRU5ErkJggg==';

http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/creative-job/health') {
      const provider = openAICreativeProviderStatus();
      const local = localCreativeProviderStatus();
      return send(res,200,{ok:true,service:'easy-creative-orchestrator',version:'0.4.0',provider:provider.provider,visionProvider:provider.visionProvider,generationEnabled:provider.generationEnabled,integrityEnabled:provider.integrityEnabled,status:provider.status,reason:provider.reason,localProvider:local});
    }
    if (req.method === 'GET' && u.pathname === '/api/creative-job/self-test') {
      if (!selfTestEnabled()) return send(res,404,{error:'not_found'});
      const result = await runCreativeJob({
        mode:'openai',
        asset:{assetId:'provider-smoke',mimeType:'image/png',fileName:'provider-smoke.png',dataUrl:testAsset,width:1,height:1},
        request:{direction:'Create a minimal realistic commercial presentation. Preserve every immutable product detail exactly; do not invent claims or product features.'},
      }, openAICreativeProvider());
      const summary = {jobId:result.jobId,status:result.status,decision:result.decision,reason:result.reason||null,errorDetail:result.errorDetail||null,stages:result.events?.map(({stage,decision,reason,error})=>({stage,decision,reason:reason||null,error:error||null}))||[],integrity:{core:result.validation?.core?.decision||result.validation?.decision||null,provider:result.validation?.provider?.decision||null},generatedImage:Boolean(result.output?.dataUrl||result.output?.base64)};
      const passed = summary.status === 'SUCCEEDED' && summary.decision === 'PASS' && summary.generatedImage && summary.integrity.core === 'PASS' && summary.integrity.provider === 'PASS';
      console.log('CREATIVE_REAL_SELF_TEST', JSON.stringify({...summary,passed}));
      return send(res,passed ? 200 : 503,{...summary,passed});
    }
    if (req.method !== 'POST' || u.pathname !== '/api/creative-job/run') return send(res,404,{error:'not_found'});
    const input = await body(req);
    const mode = String(input.mode || 'auto').trim().toLowerCase();
    if (mode === 'local' && !input.asset?.dataUrl && !input.dataUrl) return send(res,400,{error:'source_asset_required',code:'asset_bytes_missing'});
    return send(res,200,await runCreativeJobWithFallback({ ...input, mode }));
  } catch(error) { return send(res,error.status||400,{error:error.message||'request_failed',code:error.code||'request_failed'}); }
}).listen(port,'127.0.0.1',()=>console.log(`EASY Creative Orchestrator listening on ${port}`));
