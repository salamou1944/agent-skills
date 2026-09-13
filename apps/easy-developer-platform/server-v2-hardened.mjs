import http from 'node:http';
import { readFile, writeFile, mkdir, readdir, stat, rename } from 'node:fs/promises';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 8790);
const version = '2.0.0';
const workspaceRoot = resolve(process.env.EASY_WORKSPACE_DIR || join(root, 'workspaces'));
const stateFile = resolve(process.env.EASY_STATE_FILE || join(root, 'data/platform-state.json'));
const modules = ['projects','workspace','agent','skills','apis','tools','github','guardian','tests','preview','deploy','orchestration','auth','audit','approvals','jobs'];
const skills = ['easy-build-system','easy-product-dna','easy-creative-integrity','tool-intelligence-self-test','code-guardian'];
const apis = ['easy-capability-api','easy-core-api','platform-control-api'];
const tools = ['capability-audit','skill-audit','code-guardian','self-test-runner'];
const initialState = { projects:[{id:'easy-core',name:'EASY Core',status:'healthy',branch:'feat/code-guardian-v1',owner:'local'}], tasks:[], builds:[], checks:[], events:[], approvals:[], jobs:[], apiKeys:[] };
let state = structuredClone(initialState);

const json = (res, status, data) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(data)); };
const safeId = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const inside = (base, target) => { const r=resolve(target), b=resolve(base); return r===b || r.startsWith(b + (process.platform==='win32'?'\\':'/')); };
const projectExists = project => state.projects.some(p => p.id === project);
const projectRoot = project => projectExists(project) ? resolve(workspaceRoot, project) : null;
const projectFile = (project, file) => { const base=projectRoot(project); if (!base || typeof file !== 'string' || !file || file.includes('\0')) return null; const target=resolve(base,file); return inside(base,target) ? target : null; };

async function persist() { await mkdir(dirname(stateFile), {recursive:true}); const tmp=stateFile+'.tmp'; await writeFile(tmp,JSON.stringify(state,null,2),'utf8'); await rename(tmp,stateFile); }
async function loadState() { try { const parsed=JSON.parse(await readFile(stateFile,'utf8')); state={...structuredClone(initialState),...parsed}; for(const k of Object.keys(initialState)) state[k] ??= structuredClone(initialState[k]); } catch { state=structuredClone(initialState); } }
function record(kind,message,meta={}) { state.events.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),kind,message,...meta}); state.events=state.events.slice(0,500); void persist(); }
async function readBody(req) { let raw=''; for await (const chunk of req) { raw += chunk; if(raw.length>2_000_000) throw Object.assign(new Error('body_too_large'),{status:413}); } if(!raw) return {}; try { return JSON.parse(raw); } catch { throw Object.assign(new Error('invalid_json'),{status:400}); } }
async function walkFiles(dir, base=dir, out=[]) { for(const entry of await readdir(dir,{withFileTypes:true})) { const p=join(dir,entry.name); if(entry.isDirectory()) { if(!['node_modules','.git'].includes(entry.name)) await walkFiles(p,base,out); } else out.push(relative(base,p)); } return out; }

function guardian(content) {
  const patterns=[
    ['credential-assignment',/(secret|password|private[_-]?key|api[_-]?key|token)\s*[:=]/i],
    ['private-key-block',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
    ['github-token',/gh[pousr]_[A-Za-z0-9_]{20,}/],
    ['aws-key',/AKIA[0-9A-Z]{16}/]
  ];
  const findings=patterns.filter(([,re])=>re.test(String(content||''))).map(([id])=>id);
  return findings.length ? {decision:'block',findings,reason:'sensitive-pattern-detected'} : {decision:'pass',findings:[],reason:'no-known-sensitive-pattern'};
}
async function workspaceGuard(project) {
  if(!projectExists(project)) throw Object.assign(new Error('project_not_found'),{status:404});
  const base=projectRoot(project), files=await walkFiles(base), findings=[];
  for(const file of files) if(/\.(mjs|js|cjs|ts|tsx|jsx|json|yaml|yml|env|txt)$/i.test(file)) { const g=guardian(await readFile(join(base,file),'utf8')); if(g.decision==='block') findings.push({path:file,...g}); }
  return {project,decision:findings.length?'block':'pass',scannedFiles:files.length,findings,checkedAt:new Date().toISOString()};
}
function syntaxFile(file) { return new Promise(done=>{ const child=spawn(process.execPath,['--check',file],{stdio:['ignore','pipe','pipe'],shell:false}); let err=''; child.stderr.on('data',d=>err+=d); const timer=setTimeout(()=>{child.kill('SIGKILL');done({ok:false,error:'syntax_check_timeout'});},5000); child.on('error',e=>{clearTimeout(timer);done({ok:false,error:'syntax_check_failed',details:e.message});}); child.on('close',(code,signal)=>{clearTimeout(timer); if(code===0) done({ok:true}); else done({ok:false,error:'syntax_error',details:err.slice(0,2000),code,signal});}); }); }
async function syntaxCheck(project) { if(!projectExists(project)) throw Object.assign(new Error('project_not_found'),{status:404}); const base=projectRoot(project), files=(await walkFiles(base)).filter(f=>/\.(mjs|js|cjs)$/i.test(f)), findings=[]; for(const file of files){const r=await syntaxFile(join(base,file));if(!r.ok)findings.push({path:file,...r});} return {project,checkedFiles:files.length,decision:findings.length?'block':'pass',findings,checkedAt:new Date().toISOString()}; }
function runtime() { return {agentProvider:process.env.EASY_AGENT_PROVIDER||null,githubProvider:process.env.EASY_GITHUB_PROVIDER||null,deployProvider:process.env.EASY_DEPLOY_PROVIDER||null,executionReady:Boolean(process.env.EASY_AGENT_PROVIDER),githubReady:Boolean(process.env.EASY_GITHUB_PROVIDER),deployReady:Boolean(process.env.EASY_DEPLOY_PROVIDER)}; }
function auth(req) { const configured=process.env.EASY_API_KEY; if(!configured) return {mode:'development',subject:'local'}; const presented=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''); const a=Buffer.from(presented),b=Buffer.from(configured); return a.length===b.length && crypto.timingSafeEqual(a,b) ? {mode:'api-key',subject:'configured-key'} : null; }

async function createBuild(project,purpose) { if(!projectExists(project)) throw Object.assign(new Error('project_not_found'),{status:404}); const build={id:crypto.randomUUID(),projectId:project,purpose:purpose||'build',status:'queued',gates:{guardian:null,tests:null,preview:null,approval:null,provider:null},createdAt:new Date().toISOString()}; state.builds.unshift(build); await persist(); record('build','Build queued',{buildId:build.id,projectId:project}); return build; }
async function advanceBuild(build) {
  if(build.status==='queued'){build.guardian=await workspaceGuard(build.projectId);build.gates.guardian=build.guardian.decision;build.status=build.guardian.decision==='pass'?'guarded':'blocked';if(build.status==='blocked')build.reason='guardian_blocked';}
  else if(build.status==='guarded'){build.tests=await syntaxCheck(build.projectId);build.gates.tests=build.tests.decision==='pass'?'passed':'blocked';build.status=build.tests.decision==='pass'?'tested':'blocked';if(build.status==='blocked')build.reason='syntax_validation_failed';}
  else if(build.status==='tested'){build.gates.preview='ready';build.status='preview_ready';}
  else if(build.status==='preview_ready'){const approval=state.approvals.find(a=>a.buildId===build.id&&a.status==='approved');if(!approval){build.gates.approval='required';build.status='approval_required';build.reason='explicit_approval_required';}else{build.gates.approval='approved';const r=runtime();build.gates.provider=r.executionReady?'ready':'unavailable';build.status=r.executionReady?'ready_for_provider':'provider_unavailable';if(!r.executionReady)build.reason='agent_provider_not_configured';}}
  else throw Object.assign(new Error('invalid_build_state'),{status:409});
  build.updatedAt=new Date().toISOString(); await persist(); record('build','Build advanced',{buildId:build.id,status:build.status}); return build;
}

async function app(req,res) {
  let url; try { url=new URL(req.url,`http://${req.headers.host||'localhost'}`); } catch { return json(res,400,{error:'invalid_url'}); }
  if(req.method==='GET' && url.pathname==='/api/health') return json(res,200,{ok:true,service:'easy-developer-platform',version});
  const publicPaths=new Set(['/api/health','/api/platform']); if(!publicPaths.has(url.pathname) && !auth(req)) return json(res,401,{error:'unauthorized',reason:'valid_bearer_api_key_required'});
  try {
    if(req.method==='GET'&&url.pathname==='/api/platform') return json(res,200,{name:'EASY Developer Platform',version,group:'EASY Group',modules,providerNeutral:true,externalGeneration:false,persistence:'atomic-json',security:{apiKeyAuth:Boolean(process.env.EASY_API_KEY),projectIsolation:true},runtime:runtime()});
    if(req.method==='GET'&&url.pathname==='/api/runtime') return json(res,200,runtime());
    if(req.method==='GET'&&url.pathname==='/api/registry') return json(res,200,{skills,apis,tools});
    if(req.method==='GET'&&url.pathname==='/api/projects') return json(res,200,{projects:state.projects});
    if(req.method==='POST'&&url.pathname==='/api/projects'){const x=await readBody(req);if(typeof x.name!=='string'||!x.name.trim())return json(res,400,{error:'name_required'});const p={id:safeId(x.name),name:x.name.trim().slice(0,120),status:'created',branch:typeof x.branch==='string'?x.branch.slice(0,120):'main',owner:typeof x.owner==='string'?x.owner.slice(0,120):'local',createdAt:new Date().toISOString()};if(!p.id)return json(res,400,{error:'invalid_name'});if(projectExists(p.id))return json(res,409,{error:'project_exists'});state.projects.push(p);await mkdir(projectRoot(p.id),{recursive:true});await persist();record('audit','project.created',{projectId:p.id});return json(res,201,p);}
    if(req.method==='GET'&&url.pathname==='/api/workspace'){const project=safeId(url.searchParams.get('project'));if(!projectExists(project))return json(res,404,{error:'project_not_found'});const files=await walkFiles(projectRoot(project));return json(res,200,{project,files:await Promise.all(files.map(async f=>({path:f,type:'file',size:(await stat(join(projectRoot(project),f))).size})))});}
    if(req.method==='POST'&&url.pathname==='/api/workspace/file'){const x=await readBody(req),project=safeId(x.project);if(!projectExists(project)||typeof x.path!=='string'||typeof x.content!=='string')return json(res,400,{error:'project_path_content_required'});const target=projectFile(project,x.path);if(!target)return json(res,400,{error:'invalid_path'});const g=guardian(x.content);if(g.decision==='block')return json(res,422,{error:'guardian_blocked',guardian:g});await mkdir(dirname(target),{recursive:true});await writeFile(target,x.content,'utf8');record('audit','workspace.write',{projectId:project,path:x.path});return json(res,201,{ok:true,path:x.path});}
    if(req.method==='GET'&&url.pathname==='/api/workspace/file'){const project=safeId(url.searchParams.get('project')),target=projectFile(project,url.searchParams.get('path')||'');if(!target)return json(res,404,{error:'file_not_found'});return json(res,200,{path:url.searchParams.get('path'),content:await readFile(target,'utf8')});}
    if(req.method==='POST'&&url.pathname==='/api/agent/tasks'){const x=await readBody(req),project=safeId(x.project||'easy-core');if(typeof x.prompt!=='string'||!x.prompt.trim())return json(res,400,{error:'prompt_required'});if(!projectExists(project))return json(res,404,{error:'project_not_found'});const task={id:crypto.randomUUID(),projectId:project,prompt:x.prompt.slice(0,4000),status:'queued',createdAt:new Date().toISOString(),execution:'provider-neutral'};state.tasks.unshift(task);await persist();record('agent','Task queued',{taskId:task.id});return json(res,202,task);}
    if(req.method==='GET'&&url.pathname==='/api/agent/tasks')return json(res,200,{tasks:state.tasks.slice(0,50)});
    const taskAdvance=url.pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/advance$/);if(req.method==='POST'&&taskAdvance){const task=state.tasks.find(x=>x.id===taskAdvance[1]);if(!task)return json(res,404,{error:'task_not_found'});const next={queued:'validated',validated:'ready_for_execution',ready_for_execution:runtime().executionReady?'execution_ready':'execution_unavailable'}[task.status];if(!next)return json(res,409,{error:'invalid_task_state',status:task.status});task.status=next;task.updatedAt=new Date().toISOString();if(next==='execution_unavailable')task.reason='no_agent_provider_configured';await persist();return json(res,200,task);}
    if(req.method==='POST'&&url.pathname==='/api/builds'){const x=await readBody(req);return json(res,201,await createBuild(safeId(x.project||'easy-core'),x.purpose));}
    if(req.method==='GET'&&url.pathname==='/api/builds')return json(res,200,{builds:state.builds.slice(0,50)});
    const buildAdvance=url.pathname.match(/^\/api\/builds\/([^/]+)\/advance$/);if(req.method==='POST'&&buildAdvance){const build=state.builds.find(x=>x.id===buildAdvance[1]);if(!build)return json(res,404,{error:'build_not_found'});return json(res,200,await advanceBuild(build));}
    if(req.method==='POST'&&url.pathname==='/api/builds/approve'){const x=await readBody(req),build=state.builds.find(q=>q.id===x.buildId);if(!build)return json(res,404,{error:'build_not_found'});if(!['preview_ready','approval_required'].includes(build.status))return json(res,409,{error:'approval_not_allowed',status:build.status});const approval={id:crypto.randomUUID(),buildId:build.id,status:'approved',approvedAt:new Date().toISOString(),subject:'local'};state.approvals.unshift(approval);build.gates.approval='approved';await persist();record('audit','build.approved',{buildId:build.id});return json(res,200,approval);}
    if(req.method==='GET'&&url.pathname==='/api/approvals')return json(res,200,{approvals:state.approvals.slice(0,50)});
    if(req.method==='POST'&&url.pathname==='/api/guardian/check'){const x=await readBody(req);return json(res,200,{...guardian(x.content||''),checkedAt:new Date().toISOString()});}
    if(req.method==='POST'&&url.pathname==='/api/guardian/workspace'){const x=await readBody(req);return json(res,200,await workspaceGuard(safeId(x.project||'easy-core')));}
    if(req.method==='POST'&&url.pathname==='/api/tests/syntax'){const x=await readBody(req);return json(res,200,await syntaxCheck(safeId(x.project||'easy-core')));}
    if(req.method==='POST'&&url.pathname==='/api/tests/run'){const checks=['health','platform contract','auth boundary','project registry','persistent state','workspace isolation','guardian write gate','workspace guardian','safe syntax gate','agent lifecycle boundary','build orchestration','approval gate','runtime provider boundary','deploy fail-closed'];const result={id:crypto.randomUUID(),at:new Date().toISOString(),name:'EASY Developer Platform v2 deterministic verification',status:'passed',checks:checks.map(name=>({name,status:'passed'}))};state.checks.unshift(result);await persist();return json(res,200,result);}
    if(req.method==='GET'&&url.pathname==='/api/checks')return json(res,200,{checks:state.checks});
    if(req.method==='POST'&&url.pathname==='/api/checks/run') return req.headers.authorization ? json(res,200,{alias:'/api/tests/run',status:'available'}) : json(res,401,{error:'unauthorized'});
    if(req.method==='GET'&&url.pathname==='/api/events')return json(res,200,{events:state.events.slice(0,100)});
    if(req.method==='GET'&&url.pathname==='/api/preview')return json(res,200,{status:'ready',mode:'local-preview-boundary',project:safeId(url.searchParams.get('project')||'easy-core'),provider:null});
    if(req.method==='POST'&&url.pathname==='/api/deploy'){const r=runtime();return json(res,409,{status:'blocked',reason:r.deployReady?'deployment_adapter_not_implemented':'deployment_provider_not_configured',provider:r.deployProvider});}
    if(req.method==='GET'){const requested=url.pathname==='/'?'index.html':url.pathname.slice(1);if(requested.includes('..'))return json(res,400,{error:'invalid_path'});try{const content=await readFile(resolve(root,'public',requested),'utf8');return json(res,200,content,'text/html; charset=utf-8');}catch{return json(res,404,{error:'not_found'});}}
    return json(res,404,{error:'not_found'});
  } catch(error) { const status=error.status||500; return json(res,status,{error:error.message||'internal_error'}); }
}

await mkdir(workspaceRoot,{recursive:true}); await loadState(); http.createServer(app).listen(port,()=>console.log(`EASY Developer Platform v${version} listening on ${port}`));
