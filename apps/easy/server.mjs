import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const IMMUTABLE = ['color','logo','printedText','brandName','shape','components','designDetails'];
const port = Number(process.env.PORT || 8787);

const send = (res, status, data) => {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(data));
};
const readBody = async req => { let s=''; for await (const c of req) s+=c; return s ? JSON.parse(s) : {}; };
const gate = dna => ({missing: IMMUTABLE.filter(k => dna?.[k] === undefined || dna?.[k] === null || dna?.[k] === ''), immutable: IMMUTABLE});

async function app(req,res) {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && u.pathname === '/api/health') return send(res,200,{ok:true,service:'easy-core',version:'0.1.0'});
  if (req.method === 'GET' && u.pathname === '/api/capabilities') return send(res,200,{productDNA:true,integrityGate:true,creativePlanning:true,providerNeutral:true,externalGeneration:false});
  if (req.method === 'POST' && u.pathname === '/api/product-dna') {
    const x = await readBody(req);
    if (!x.productName) return send(res,400,{error:'productName_required'});
    const dna = {schemaVersion:'1.0',productName:x.productName};
    for (const k of IMMUTABLE) dna[k] = x[k] ?? null;
    const g=gate(dna); return send(res,200,{dna,ready:g.missing.length===0,gate:g});
  }
  if (req.method === 'POST' && u.pathname === '/api/creative/plan') {
    const x=await readBody(req); const g=gate(x.dna);
    if (g.missing.length) return send(res,409,{status:'blocked',gate:g});
    return send(res,200,{status:'ready_for_provider',provider:null,instruction:{immutable:x.dna,flexible:x.preferences||{},constraints:['preserve immutable identity','do not invent facts']}});
  }
  if (req.method === 'POST' && u.pathname === '/api/creative/validate') {
    const x=await readBody(req); const checks=IMMUTABLE.map(k=>({field:k,status:JSON.stringify(x.dna?.[k])===JSON.stringify(x.output?.[k])?'pass':'review'}));
    return send(res,200,{decision:checks.every(c=>c.status==='pass')?'pass':'block',checks});
  }
  if (req.method === 'GET') {
    const file=u.pathname==='/' ? 'index.html' : u.pathname.slice(1);
    if (file.includes('..')) return send(res,403,{error:'forbidden'});
    try { const data=await readFile(join(root,'public',file)); res.writeHead(200,{'content-type':'text/html; charset=utf-8'}); return res.end(data); } catch {}
  }
  return send(res,404,{error:'not_found'});
}
http.createServer((q,s)=>app(q,s).catch(()=>send(s,500,{error:'internal_error'}))).listen(port,()=>console.log(`EASY core: http://localhost:${port}`));
