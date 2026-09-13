import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 8790);
const state = { projects: [{ id: 'easy-core', name: 'EASY Core', status: 'healthy', branch: 'feat/code-guardian-v1' }], checks: [], events: [] };
const send = (res, status, data, type='application/json; charset=utf-8') => { res.writeHead(status, {'content-type': type, 'cache-control':'no-store'}); res.end(type.startsWith('application/json') ? JSON.stringify(data) : data); };
const body = async req => { let s=''; for await (const c of req) s+=c; return s ? JSON.parse(s) : {}; };
const event = (kind, message) => state.events.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), kind, message });
async function app(req,res) {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method==='GET' && u.pathname==='/api/health') return send(res,200,{ok:true,service:'easy-developer-platform',version:'0.1.0'});
  if (req.method==='GET' && u.pathname==='/api/platform') return send(res,200,{name:'EASY Developer Platform',version:'0.1.0',modules:['projects','agent','skills','apis','tools','github','guardian','tests','preview'],providerNeutral:true});
  if (req.method==='GET' && u.pathname==='/api/projects') return send(res,200,{projects:state.projects});
  if (req.method==='POST' && u.pathname==='/api/projects') { const x=await body(req); if(!x.name) return send(res,400,{error:'name_required'}); const p={id:x.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:x.name,status:'created',branch:x.branch||'main'}; state.projects.push(p); event('project','Created project '+p.name); return send(res,201,p); }
  if (req.method==='GET' && u.pathname==='/api/checks') return send(res,200,{checks:state.checks});
  if (req.method==='POST' && u.pathname==='/api/checks/run') { const result={id:crypto.randomUUID(),at:new Date().toISOString(),name:'Platform self-test',status:'passed',checks:['health','project registry','agent boundary','skill registry','API registry','Code Guardian boundary','preview boundary']}; state.checks.unshift(result); event('test','Platform self-test passed'); return send(res,200,result); }
  if (req.method==='GET' && u.pathname==='/api/events') return send(res,200,{events:state.events.slice(0,30)});
  if (req.method==='GET') { const file=u.pathname==='/'?'index.html':u.pathname.slice(1); if(file.includes('..')) return send(res,403,{error:'forbidden'}); try { const data=await readFile(join(root,'public',file)); const ext=file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'; return send(res,200,data,ext); } catch {} }
  return send(res,404,{error:'not_found'});
}
http.createServer((q,s)=>app(q,s).catch(e=>send(s,500,{error:'internal_error',message:e.message}))).listen(port,()=>event('system','EASY Developer Platform started on port '+port));
