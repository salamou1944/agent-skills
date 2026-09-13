import http from 'node:http';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const port=Number(process.env.SUPERVISOR_PORT||8791);
const repoRoot=process.env.EASY_REPO_ROOT||process.cwd();
const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))};
const run=(file,args=[])=>new Promise(resolve=>{const p=spawn(process.execPath,[file,...args],{cwd:repoRoot,stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('close',code=>resolve({code,stdout:out,stderr:err}))});
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&u.pathname==='/api/supervisor/health')return send(res,200,{ok:true,service:'easy-platform-supervisor',checkedAt:new Date().toISOString()});
  if(req.method==='GET'&&u.pathname==='/api/supervisor/registry')return send(res,200,{skills:['truth-evidence-guardian','runtime-verification-operator','recovery-orchestrator','platform-supervisor'],tools:['platform-runtime-check','platform-repo-audit','platform-supervisor'],apis:['supervisor-health','supervisor-registry','supervisor-report']});
  if(req.method==='POST'&&u.pathname==='/api/supervisor/run'){
   const repo=await run('scripts/platform-repo-audit.mjs',[repoRoot]);
   const runtimeUrl=process.env.EASY_PLATFORM_URL;
   const runtime=runtimeUrl?await run('scripts/platform-runtime-check.mjs',[runtimeUrl]):null;
   const failures=[repo,...(runtime?[runtime]:[])].filter(x=>x.code!==0);
   return send(res,failures.length?503:200,{status:failures.length?'FAILED':'VERIFIED',repo:{code:repo.code,output:repo.stdout},runtime:runtime?{code:runtime.code,output:runtime.stdout}:null,checkedAt:new Date().toISOString()});
  }
  return send(res,404,{error:'not_found'});
 }catch(error){return send(res,500,{status:'FAILED',error:String(error.message||error)})}
});
server.listen(port,()=>console.log(`EASY platform supervisor API listening on ${port}`));
