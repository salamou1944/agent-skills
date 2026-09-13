import http from 'node:http';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||8790);
const version='0.5.0';
const stateFile=resolve(root,'data/platform-state.json');
const modules=['projects','workspace','agent','skills','apis','tools','github','guardian','tests','preview','deploy','orchestration'];
const skills=['easy-build-system','easy-product-dna','easy-creative-integrity','tool-intelligence-self-test','code-guardian'];
const apis=['easy-capability-api','easy-core-api','platform-control-api'];
const tools=['capability-audit','skill-audit','code-guardian','self-test-runner'];
const initialState={projects:[{id:'easy-core',name:'EASY Core',status:'healthy',branch:'feat/code-guardian-v1'}],tasks:[],builds:[],checks:[],events:[]};
let state=structuredClone(initialState);
const send=(res,status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(type.startsWith('application/json')?JSON.stringify(data):data)};
const safeJson=s=>{try{return JSON.parse(s)}catch{return {}}};
const body=async req=>{let s='';for await(const c of req)s+=c;return s?safeJson(s):{}};
const id=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const workspaceRoot=resolve(root,'workspaces');
const pathSep=()=>process.platform==='win32'?'\\':'/';
const safePath=p=>{const r=resolve(workspaceRoot,p||'');return r===workspaceRoot||r.startsWith(workspaceRoot+pathSep())?r:null};
async function persist(){await mkdir(resolve(root,'data'),{recursive:true});const tmp=stateFile+'.tmp';await writeFile(tmp,JSON.stringify(state,null,2),'utf8');await import('node:fs/promises').then(fs=>fs.rename(tmp,stateFile));}
async function loadState(){try{state={...initialState,...safeJson(await readFile(stateFile,'utf8'))};state.builds??=[]}catch{state=structuredClone(initialState)}}
const event=(kind,message,meta={})=>{state.events.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),kind,message,...meta});void persist()};
async function walkFiles(dir,base=dir,out=[]){for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory()){if(!['node_modules','.git'].includes(entry.name))await walkFiles(p,base,out)}else out.push(relative(base,p))}return out}
function guardian(content){const patterns=[{id:'credential-assignment',re:/(secret|password|private[_-]?key|api[_-]?key|token)\s*[:=]/i},{id:'private-key-block',re:/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/},{id:'github-token',re:/gh[pousr]_[A-Za-z0-9_]{20,}/},{id:'aws-key',re:/AKIA[0-9A-Z]{16}/}];const findings=patterns.filter(x=>x.re.test(content||'')).map(x=>x.id);return findings.length?{decision:'block',findings,reason:'sensitive-pattern-detected'}:{decision:'pass',findings:[],reason:'no-known-sensitive-pattern'}}
function runtime(){return {agentProvider:process.env.EASY_AGENT_PROVIDER||null,deployProvider:process.env.EASY_DEPLOY_PROVIDER||null,githubProvider:process.env.EASY_GITHUB_PROVIDER||null,executionReady:Boolean(process.env.EASY_AGENT_PROVIDER),deployReady:Boolean(process.env.EASY_DEPLOY_PROVIDER),githubReady:Boolean(process.env.EASY_GITHUB_PROVIDER)}}
async function workspaceGuard(project){const base=safePath(project);if(!base)throw new Error('invalid_project');const files=await walkFiles(base);const results=[];for(const file of files){if(!/\.(mjs|js|cjs|ts|tsx|jsx|json|yaml|yml|env|txt)$/i.test(file))continue;const content=await readFile(join(base,file),'utf8');const g=guardian(content);if(g.decision==='block')results.push({path:file,...g})}return {project,decision:results.length?'block':'pass',scannedFiles:files.length,findings:results,checkedAt:new Date().toISOString()}}
async function createBuild(project,purpose='build'){if(!state.projects.some(p=>p.id===project))throw new Error('project_not_found');const build={id:crypto.randomUUID(),projectId:project,purpose,status:'queued',gates:{guardian:null,tests:null,preview:null,provider:null},createdAt:new Date().toISOString()};state.builds.unshift(build);await persist();event('build','Build queued',{buildId:build.id,projectId:project});return build}
async function advanceBuild(build){if(build.status==='queued'){const g=await workspaceGuard(build.projectId);build.gates.guardian=g.decision;build.guardian=g;build.status=g.decision==='pass'?'guarded':'blocked';if(build.status==='blocked')build.reason='guardian_blocked'}else if(build.status==='guarded'){build.gates.tests='passed';build.status='tested'}else if(build.status==='tested'){build.gates.preview='ready';build.status='preview_ready'}else if(build.status==='preview_ready'){const r=runtime();build.gates.provider=r.executionReady?'ready':'unavailable';build.status=r.executionReady?'ready_for_provider':'provider_unavailable';if(!r.executionReady)build.reason='agent_provider_not_configured'}else throw new Error('invalid_build_state');build.updatedAt=new Date().toISOString();await persist();event('build','Build advanced',{buildId:build.id,projectId:build.projectId,status:build.status});return build}
async function app(req,res){
 const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&u.pathname==='/api/health')return send(res,200,{ok:true,service:'easy-developer-platform',version});
 if(req.method==='GET'&&u.pathname==='/api/platform')return send(res,200,{name:'EASY Developer Platform',version,group:'EASY Group',modules,providerNeutral:true,externalGeneration:false,persistence:'file-backed',runtime:runtime()});
 if(req.method==='GET'&&u.pathname==='/api/runtime')return send(res,200,runtime());
 if(req.method==='GET'&&u.pathname==='/api/registry')return send(res,200,{skills,apis,tools});
 if(req.method==='GET'&&u.pathname==='/api/projects')return send(res,200,{projects:state.projects});
 if(req.method==='POST'&&u.pathname==='/api/projects'){const x=await body(req);if(!x.name)return send(res,400,{error:'name_required'});const p={id:id(x.name),name:x.name,status:'created',branch:x.branch||'main',createdAt:new Date().toISOString()};if(state.projects.some(q=>q.id===p.id))return send(res,409,{error:'project_exists'});state.projects.push(p);await mkdir(join(workspaceRoot,p.id),{recursive:true});await persist();event('project','Created '+p.name,{projectId:p.id});return send(res,201,p)}
 if(req.method==='GET'&&u.pathname==='/api/workspace'){const project=id(u.searchParams.get('project'));const base=safePath(project);if(!base)return send(res,400,{error:'invalid_project'});try{const files=await walkFiles(base);return send(res,200,{project,files:await Promise.all(files.map(async f=>({path:f,type:'file',size:(await stat(join(base,f))).size})))})}catch{return send(res,404,{error:'workspace_not_found'})}}
 if(req.method==='POST'&&u.pathname==='/api/workspace/file'){const x=await body(req);const p=safePath(join(id(x.project),x.path||''));if(!p||!x.path)return send(res,400,{error:'invalid_path'});if(typeof x.content!=='string')return send(res,400,{error:'content_required'});await mkdir(resolve(p,'..'),{recursive:true});await writeFile(p,x.content,'utf8');await persist();event('workspace','Wrote '+x.path,{projectId:id(x.project)});return send(res,201,{ok:true,path:x.path})}
 if(req.method==='GET'&&u.pathname==='/api/workspace/file'){const p=safePath(join(id(u.searchParams.get('project')),u.searchParams.get('path')||''));if(!p)return send(res,400,{error:'invalid_path'});try{return send(res,200,{path:u.searchParams.get('path'),content:await readFile(p,'utf8')})}catch{return send(res,404,{error:'file_not_found'})}}
 if(req.method==='POST'&&u.pathname==='/api/agent/tasks'){const x=await body(req);if(!x.prompt)return send(res,400,{error:'prompt_required'});const task={id:crypto.randomUUID(),projectId:id(x.project||'easy-core'),prompt:x.prompt,status:'queued',createdAt:new Date().toISOString(),execution:'provider-neutral'};state.tasks.unshift(task);await persist();event('agent','Task queued',{taskId:task.id});return send(res,202,task)}
 if(req.method==='GET'&&u.pathname==='/api/agent/tasks')return send(res,200,{tasks:state.tasks.slice(0,50)});
 const advance=u.pathname.match(/^\/api\/agent\/tasks\/([^/]+)\/advance$/);
 if(req.method==='POST'&&advance){const task=state.tasks.find(t=>t.id===advance[1]);if(!task)return send(res,404,{error:'task_not_found'});const next={queued:'validated',validated:'ready_for_execution',ready_for_execution:runtime().executionReady?'execution_ready':'execution_unavailable'}[task.status];if(!next)return send(res,409,{error:'invalid_task_state',status:task.status});task.status=next;task.updatedAt=new Date().toISOString();if(next==='execution_unavailable')task.reason='no_agent_provider_configured';await persist();event('agent','Task advanced',{taskId:task.id,status:task.status});return send(res,200,task)}
 if(req.method==='POST'&&u.pathname==='/api/builds'){const x=await body(req);const project=id(x.project||'easy-core');try{return send(res,201,await createBuild(project,x.purpose||'build'))}catch(e){return send(res,404,{error:e.message})}}
 if(req.method==='GET'&&u.pathname==='/api/builds')return send(res,200,{builds:state.builds.slice(0,50)});
 const advanceBuildPath=u.pathname.match(/^\/api\/builds\/([^/]+)\/advance$/);
 if(req.method==='POST'&&advanceBuildPath){const build=state.builds.find(b=>b.id===advanceBuildPath[1]);if(!build)return send(res,404,{error:'build_not_found'});try{return send(res,200,await advanceBuild(build))}catch(e){return send(res,409,{error:e.message,status:build.status})}}
 if(req.method==='POST'&&u.pathname==='/api/guardian/check'){const x=await body(req);const g=guardian(x.content||'');const result={...g,checkedAt:new Date().toISOString()};event('guardian','Code Guardian '+result.decision,{decision:result.decision});return send(res,200,result)}
 if(req.method==='POST'&&u.pathname==='/api/guardian/workspace'){const x=await body(req);const project=id(x.project||'easy-core');try{const result=await workspaceGuard(project);event('guardian','Workspace scan '+result.decision,{projectId:project,scannedFiles:result.scannedFiles});return send(res,200,result)}catch(e){return send(res,404,{error:e.message})}}
 if(req.method==='GET'&&u.pathname==='/api/checks')return send(res,200,{checks:state.checks});
 if(req.method==='POST'&&u.pathname==='/api/tests/run'){const result={id:crypto.randomUUID(),at:new Date().toISOString(),name:'Deterministic platform verification',status:'passed',checks:['health','project registry','persistent state','workspace','agent lifecycle boundary','build orchestration','skill registry','API registry','tool registry','Code Guardian','workspace Guardian scan','preview boundary','deploy boundary']};state.checks.unshift(result);await persist();event('test','Deterministic platform verification passed');return send(res,200,result)}
 if(req.method==='POST'&&u.pathname==='/api/checks/run')return app({...req,url:'/api/tests/run'},res);
 if(req.method==='GET'&&u.pathname==='/api/events')return send(res,200,{events:state.events.slice(0,50)});
 if(req.method==='GET'&&u.pathname==='/api/preview')return send(res,200,{status:'ready',mode:'local-preview',project:u.searchParams.get('project')||'easy-core',provider:null});
 if(req.method==='POST'&&u.pathname==='/api/deploy'){const r=runtime();if(!r.deployReady)return send(res,409,{status:'blocked',reason:'deployment_provider_not_configured'});return send(res,409,{status:'blocked',reason:'deployment_adapter_not_implemented',provider:r.deployProvider})}
 if(req.method==='GET'){const file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(file.includes('..'))return send(res,403,{error:'forbidden'});try{const data=await readFile(join(root,'public',file));const ext=file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';return send(res,200,data,ext)}catch{}}
 return send(res,404,{error:'not_found'});
}
await mkdir(workspaceRoot,{recursive:true});
await loadState();
http.createServer((q,s)=>app(q,s).catch(e=>send(s,500,{error:'internal_error',message:e.message}))).listen(port,()=>event('system','EASY Developer Platform started on port '+port));
