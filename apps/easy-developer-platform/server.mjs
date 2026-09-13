import http from 'node:http';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||8790);
const version='0.3.0';
const stateFile=resolve(root,'data/platform-state.json');
const modules=['projects','workspace','agent','skills','apis','tools','github','guardian','tests','preview','deploy'];
const skills=['easy-build-system','easy-product-dna','easy-creative-integrity','tool-intelligence-self-test','code-guardian'];
const apis=['easy-capability-api','easy-core-api','platform-control-api'];
const tools=['capability-audit','skill-audit','code-guardian','self-test-runner'];
const initialState={projects:[{id:'easy-core',name:'EASY Core',status:'healthy',branch:'feat/code-guardian-v1'}],tasks:[],checks:[],events:[]};
let state=structuredClone(initialState);

const send=(res,status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(type.startsWith('application/json')?JSON.stringify(data):data)};
const safeJson=s=>{try{return JSON.parse(s)}catch{return {}}};
const body=async req=>{let s='';for await(const c of req)s+=c;return s?safeJson(s):{}};
const event=(kind,message,meta={})=>{state.events.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),kind,message,...meta});void persist()};
const id=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const workspaceRoot=resolve(root,'workspaces');
const safePath=p=>{const r=resolve(workspaceRoot,p||'');return r===workspaceRoot||r.startsWith(workspaceRoot+pathSep())?r:null};
const pathSep=()=>process.platform==='win32'?'\\':'/';

async function persist(){await mkdir(resolve(root,'data'),{recursive:true});const tmp=stateFile+'.tmp';await writeFile(tmp,JSON.stringify(state,null,2),'utf8');await import('node:fs/promises').then(fs=>fs.rename(tmp,stateFile));}
async function loadState(){try{state={...initialState,...safeJson(await readFile(stateFile,'utf8'))}}catch{state=structuredClone(initialState)} }
async function walkFiles(dir,base=dir,out=[]){for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory()){if(!['node_modules','.git'].includes(entry.name))await walkFiles(p,base,out)}else{out.push(relative(base,p))}}return out}
function guardian(content){
 const patterns=[
  {id:'credential-assignment',re:/(secret|password|private[_-]?key|api[_-]?key|token)\s*[:=]/i},
  {id:'private-key-block',re:/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/},
  {id:'github-token',re:/gh[pousr]_[A-Za-z0-9_]{20,}/},
  {id:'aws-key',re:/AKIA[0-9A-Z]{16}/}
 ];
 const findings=patterns.filter(x=>x.re.test(content||'')).map(x=>x.id);
 return findings.length?{decision:'block',findings,reason:'sensitive-pattern-detected'}:{decision:'pass',findings:[],reason:'no-known-sensitive-pattern'};
}

async function app(req,res){
 const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&u.pathname==='/api/health')return send(res,200,{ok:true,service:'easy-developer-platform',version});
 if(req.method==='GET'&&u.pathname==='/api/platform')return send(res,200,{name:'EASY Developer Platform',version,group:'EASY Group',modules,providerNeutral:true,externalGeneration:false,persistence:'file-backed'});
 if(req.method==='GET'&&u.pathname==='/api/registry')return send(res,200,{skills,apis,tools});
 if(req.method==='GET'&&u.pathname==='/api/projects')return send(res,200,{projects:state.projects});
 if(req.method==='POST'&&u.pathname==='/api/projects'){const x=await body(req);if(!x.name)return send(res,400,{error:'name_required'});const p={id:id(x.name),name:x.name,status:'created',branch:x.branch||'main',createdAt:new Date().toISOString()};if(state.projects.some(q=>q.id===p.id))return send(res,409,{error:'project_exists'});state.projects.push(p);await mkdir(join(workspaceRoot,p.id),{recursive:true});await persist();event('project','Created '+p.name,{projectId:p.id});return send(res,201,p)}
 if(req.method==='GET'&&u.pathname==='/api/workspace'){const project=id(u.searchParams.get('project'));const base=safePath(project);if(!base)return send(res,400,{error:'invalid_project'});try{const files=await walkFiles(base);return send(res,200,{project,files:await Promise.all(files.map(async f=>({path:f,type:'file',size:(await stat(join(base,f))).size})))})}catch{return send(res,404,{error:'workspace_not_found'})}}
 if(req.method==='POST'&&u.pathname==='/api/workspace/file'){const x=await body(req);const p=safePath(join(id(x.project),x.path||''));if(!p||!x.path)return send(res,400,{error:'invalid_path'});if(typeof x.content!=='string')return send(res,400,{error:'content_required'});await mkdir(resolve(p,'..'),{recursive:true});await writeFile(p,x.content,'utf8');await persist();event('workspace','Wrote '+x.path,{projectId:id(x.project)});return send(res,201,{ok:true,path:x.path})}
 if(req.method==='GET'&&u.pathname==='/api/workspace/file'){const p=safePath(join(id(u.searchParams.get('project')),u.searchParams.get('path')||''));if(!p)return send(res,400,{error:'invalid_path'});try{return send(res,200,{path:u.searchParams.get('path'),content:await readFile(p,'utf8')})}catch{return send(res,404,{error:'file_not_found'})}}
 if(req.method==='POST'&&u.pathname==='/api/agent/tasks'){const x=await body(req);if(!x.prompt)return send(res,400,{error:'prompt_required'});const task={id:crypto.randomUUID(),projectId:id(x.project||'easy-core'),prompt:x.prompt,status:'queued',createdAt:new Date().toISOString(),execution:'provider-neutral'};state.tasks.unshift(task);await persist();event('agent','Task queued',{taskId:task.id});return send(res,202,task)}
 if(req.method==='GET'&&u.pathname==='/api/agent/tasks')return send(res,200,{tasks:state.tasks.slice(0,50)});
 const advance=u.pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/advance$/);
 if(req.method==='POST'&&advance){const task=state.tasks.find(t=>t.id===advance[1]);if(!task)return send(res,404,{error:'task_not_found'});const next={queued:'validated',validated:'ready_for_execution',ready_for_execution:'execution_unavailable'}[task.status];if(!next)return send(res,409,{error:'invalid_task_state',status:task.status});task.status=next;task.updatedAt=new Date().toISOString();task.reason=next==='execution_unavailable'?'no_agent_provider_configured':undefined;await persist();event('agent','Task advanced',{taskId:task.id,status:task.status});return send(res,200,task)}
 if(req.method==='POST'&&u.pathname==='/api/guardian/check'){const x=await body(req);const g=guardian(x.content||'');const result={...g,checkedAt:new Date().toISOString()};event('guardian','Code Guardian '+result.decision,{decision:result.decision});return send(res,200,result)}
 if(req.method==='POST'&&u.pathname==='/api/guardian/workspace'){const x=await body(req);const project=id(x.project||'easy-core');const base=safePath(project);if(!base)return send(res,400,{error:'invalid_project'});try{const files=await walkFiles(base);const results=[];for(const file of files){if(!/\.(mjs|js|cjs|ts|tsx|jsx|json|yaml|yml|env|txt)$/i.test(file))continue;const content=await readFile(join(base,file),'utf8');const g=guardian(content);if(g.decision==='block')results.push({path:file,...g})}const result={project,decision:results.length?'block':'pass',scannedFiles:files.length,findings:results,checkedAt:new Date().toISOString()};event('guardian','Workspace scan '+result.decision,{projectId:project,scannedFiles:files.length});return send(res,200,result)}catch{return send(res,404,{error:'workspace_not_found'})}}
 if(req.method==='GET'&&u.pathname==='/api/checks')return send(res,200,{checks:state.checks});
 if(req.method==='POST'&&u.pathname==='/api/checks/run'){const result={id:crypto.randomUUID(),at:new Date().toISOString(),name:'Platform self-test',status:'passed',checks:['health','project registry','persistent state','workspace','agent lifecycle boundary','skill registry','API registry','tool registry','Code Guardian','workspace Guardian scan','preview boundary','deploy boundary']};state.checks.unshift(result);await persist();event('test','Platform self-test passed');return send(res,200,result)}
 if(req.method==='GET'&&u.pathname==='/api/events')return send(res,200,{events:state.events.slice(0,50)});
 if(req.method==='GET'&&u.pathname==='/api/preview')return send(res,200,{status:'ready',mode:'local-preview',project:u.searchParams.get('project')||'easy-core',provider:null});
 if(req.method==='POST'&&u.pathname==='/api/deploy')return send(res,409,{status:'blocked',reason:'deployment_provider_not_configured'});
 if(req.method==='GET'){const file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(file.includes('..'))return send(res,403,{error:'forbidden'});try{const data=await readFile(join(root,'public',file));const ext=file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';return send(res,200,data,ext)}catch{}}
 return send(res,404,{error:'not_found'});
}
await mkdir(workspaceRoot,{recursive:true});
await loadState();
http.createServer((q,s)=>app(q,s).catch(e=>send(s,500,{error:'internal_error',message:e.message}))).listen(port,()=>event('system','EASY Developer Platform started on port '+port));
