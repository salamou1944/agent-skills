import http from 'node:http';
import { fixtureProvider, runCreativeJob } from './creative-orchestrator.mjs';
import { openAICreativeProvider, openAICreativeProviderStatus } from './openai-creative-provider.mjs';

const port = Number(process.env.EASY_CREATIVE_JOB_PORT || 8794);
const send = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(data)); };
async function body(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) throw Object.assign(new Error('body_too_large'), {status:413}); } try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('invalid_json'), {status:400}); } }

http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/creative-job/health') {
      const provider = openAICreativeProviderStatus();
      return send(res,200,{ok:true,service:'easy-creative-orchestrator',version:'0.2.0',provider:provider.provider,visionProvider:provider.visionProvider,generationEnabled:provider.generationEnabled,integrityEnabled:provider.integrityEnabled,status:provider.status,reason:provider.reason});
    }
    if (req.method !== 'POST' || u.pathname !== '/api/creative-job/run') return send(res,404,{error:'not_found'});
    const input = await body(req);
    const mode = input.mode || 'disabled';
    const provider = mode === 'fixture' ? fixtureProvider() : mode === 'openai' ? openAICreativeProvider() : null;
    return send(res,200,await runCreativeJob(input, provider));
  } catch(error) { return send(res,error.status||400,{error:error.message||'request_failed',code:error.code||'request_failed'}); }
}).listen(port,'127.0.0.1',()=>console.log(`EASY Creative Orchestrator listening on ${port}`));
