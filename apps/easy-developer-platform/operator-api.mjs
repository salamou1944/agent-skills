import http from 'node:http';
import crypto from 'node:crypto';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { submit, runOnce } from './operator-worker.mjs';
import { loadState } from './operator-state.mjs';
import { intelligenceStatus } from './operator-intelligence.mjs';
import { executeGithubChange } from './github-operator-executor.mjs';

const port=Number(process.env.EASY_OPERATOR_PORT||8792);
const bind=process.env.EASY_OPERATOR_BIND||'127.0.0.1';
const stateFile=resolve(process.env.EASY_OPERATOR_STATE||'.easy/operator-state.json');
const workspaceRoot=resolve(process.env.EASY_OPERATOR_WORKSPACE||'.');
const apiKey=process.env.EASY_OPERATOR_API_KEY||'';

const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
const authorized=req=>{if(!apiKey)return true;const presented=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const a=Buffer.from(presented),b=Buffer.from(apiKey);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100_000)throw Object.assign(new Error('body_too_large'),{status:413})}if(!raw)return{};try{return JSON.parse(raw)}catch{throw Object.assign(new Error('invalid_json'),{status:400})}}
function projectWorkspace(project){if(typeof project!=='string'||!project.trim())return workspaceRoot;const target=resolve(workspaceRoot,project);const prefix=workspaceRoot.endsWith('/')?workspaceRoot:workspaceRoot+'/';if(target!==workspaceRoot&&!target.startsWith(prefix))return null;return target}

export async function handle(req,res){
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&url.pathname==='/api/operator/health')return send(res,200,{ok:true,service:'easy-ai-operator',mode:'fail-closed',provider:'deterministic-core'});
  if(!authorized(req))return send(res,401,{error:'unauthorized'});
  try{
    if(req.method==='GET'&&url.pathname==='/api/operator/status'){
      const state=await loadState(stateFile);
      return send(res,200,{service:'easy-ai-operator',queue:{queued:state.tasks.filter(t=>t.status==='QUEUED').length,running:state.tasks.filter(t=>t.status==='RUNNING').length,verified:state.tasks.filter(t=>t.status==='VERIFIED').length,failed:state.tasks.filter(t=>t.status==='FAILED').length,blocked:state.tasks.filter(t=>t.status==='BLOCKED').length},intelligence:intelligenceStatus()});
    }
    if(req.method==='GET'&&url.pathname==='/api/operator/tasks'){
      const state=await loadState(stateFile);return send(res,200,{tasks:(state.tasks||[]).slice(0,100)});
    }
    if(req.method==='POST'&&url.pathname==='/api/operator/tasks'){
      const x=await body(req);if(typeof x.goal!=='string'||!x.goal.trim())return send(res,400,{error:'goal_required'});const workspace=projectWorkspace(x.project);if(!workspace)return send(res,400,{error:'invalid_project'});await mkdir(workspace,{recursive:true});const task=await submit(x.goal.slice(0,4000),{project:x.project||null},{stateFile,workspace});return send(res,202,task);
    }
    if(req.method==='POST'&&url.pathname==='/api/operator/run-once'){
      const x=await body(req);const workspace=projectWorkspace(x.project);if(!workspace)return send(res,400,{error:'invalid_project'});await mkdir(workspace,{recursive:true});const result=await runOnce({stateFile,workspace,maxAttempts:1});return send(res,200,{result});
    }
    if(req.method==='POST'&&url.pathname==='/api/operator/github/execute'){
      const x=await body(req);
      const result=await executeGithubChange({owner:x.owner,repo:x.repo,base:x.base,title:x.title,body:x.body,changes:x.changes,approved:x.approved===true,token:x.token||process.env.GITHUB_TOKEN||process.env.EASY_GITHUB_TOKEN});
      return send(res,result.status==='VERIFIED'?200:result.status==='WAITING_APPROVAL'?428:403,result);
    }
    return send(res,404,{error:'not_found'});
  }catch(error){return send(res,error.status||500,{error:error.message||'operator_error'});}
}

if(import.meta.url===`file://${process.argv[1]}`){
  const server=http.createServer(handle);
  server.listen(port,bind,()=>console.log(JSON.stringify({service:'easy-ai-operator',bind,port,stateFile,workspaceRoot})));
}
