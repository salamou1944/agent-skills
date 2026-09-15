import http from 'node:http';
import { fixtureProvider, runCreativeJob } from './creative-orchestrator.mjs';
import { openAICreativeProvider, openAICreativeProviderStatus } from './openai-creative-provider.mjs';

const port = Number(process.env.EASY_CREATIVE_JOB_PORT || 8794);
const send = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(data)); };
async function body(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) throw Object.assign(new Error('body_too_large'), {status:413}); } try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('invalid_json'), {status:400}); } }
const selfTestEnabled = () => String(process.env.EASY_CREATIVE_SELF_TEST || '').trim().toLowerCase() === 'true';
const testAsset = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';

http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/creative-job/health') {
      const provider = openAICreativeProviderStatus();
      return send(res,200,{ok:true,service:'easy-creative-orchestrator',version:'0.2.0',provider:provider.provider,visionProvider:provider.visionProvider,generationEnabled:provider.generationEnabled,integrityEnabled:provider.integrityEnabled,status:provider.status,reason:provider.reason});
    }
    if (req.method === 'GET' && u.pathname === '/api/creative-job/self-test') {
      if (!selfTestEnabled()) return send(res,404,{error:'not_found'});
      const result = await runCreativeJob({
        mode:'openai',
        asset:{assetId:'provider-smoke',mimeType:'image/png',fileName:'provider-smoke.png',dataUrl:testAsset,width:1,height:1},
        request:{direction:'Create a minimal realistic commercial presentation. Preserve every immutable product detail exactly; do not invent claims or product features.'},
      }, openAICreativeProvider());
      const summary = {jobId:result.jobId,status:result.status,decision:result.decision,reason:result.reason||null,stages:result.events?.map(({stage,decision,reason})=>({stage,decision,reason:reason||null}))||[],integrity:{core:result.validation?.core?.decision||result.validation?.decision||null,provider:result.validation?.provider?.decision||null},generatedImage:Boolean(result.output?.dataUrl||result.output?.base64)};
      const passed = summary.status === 'SUCCEEDED' && summary.decision === 'PASS' && summary.generatedImage && summary.integrity.core === 'PASS' && summary.integrity.provider === 'PASS';
      console.log('CREATIVE_REAL_SELF_TEST', JSON.stringify({...summary,passed}));
      return send(res,passed ? 200 : 503,{...summary,passed});
    }
    if (req.method !== 'POST' || u.pathname !== '/api/creative-job/run') return send(res,404,{error:'not_found'});
    const input = await body(req);
    const mode = input.mode || 'disabled';
    const provider = mode === 'fixture' ? fixtureProvider() : mode === 'openai' ? openAICreativeProvider() : null;
    return send(res,200,await runCreativeJob(input, provider));
  } catch(error) { return send(res,error.status||400,{error:error.message||'request_failed',code:error.code||'request_failed'}); }
}).listen(port,'127.0.0.1',()=>console.log(`EASY Creative Orchestrator listening on ${port}`));
