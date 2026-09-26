import http from 'node:http';
import crypto from 'node:crypto';
import {createTask,capabilitySnapshot,evidence} from './operator-core.mjs';
import {executeTask} from './executor.mjs';
import {probeAccounts} from './account-probes.mjs';
import {createRun,updateRun,listRuns,getRun,recoverInterruptedRuns} from './run-ledger.mjs';

const port=Number(process.env.OPERATOR_PORT||8788);
const host=process.env.OPERATOR_HOST||'127.0.0.1';
const hmac=process.env.OPERATOR_HMAC_SECRET||'';

function send(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>200000)throw Object.assign(new Error('body_too_large'),{status:413})}return s?JSON.parse(s):{}}
function validSignature(req,raw){if(!hmac)return false;const supplied=String(req.headers['x-operator-signature']||'');const expected=crypto.createHmac('sha256',hmac).update(raw).digest('hex');return supplied.length===expected.length&&crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));}

async function capabilities(){
  const observed=await probeAccounts();
  return {...capabilitySnapshot(process.env,observed),...Object.fromEntries(Object.entries(observed).map(([k,v])=>[k,{...capabilitySnapshot(process.env,observed)[k],...v}]))};
}

async function runInBackground(run,task,raw){
  await updateRun(run.runId,{state:'RUNNING',attempt:1});
  try{
    const caps=await capabilities();
    const result=await executeTask(task,{capabilities:caps,adapterInputs:raw.adapterInputs||{},runnerOverrides:raw.runnerOverrides||{}});
    await updateRun(run.runId,{state:result.completion?.ok?'VERIFIED':result.state||'FAILED',result});
  }catch(error){
    await updateRun(run.runId,{state:'FAILED',failure:{class:'execution_error',message:error.message||'operator_error'}});
  }
}

export function createServer(){
 recoverInterruptedRuns().catch(()=>{});
 return http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
   if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{status:'READY',service:'ai-operating-operator',mediator:'chatgpt',mode:'background-fail-closed'});
   if(req.method==='GET'&&url.pathname==='/capabilities')return send(res,200,{capabilities:await capabilities()});
   if(req.method==='GET'&&url.pathname==='/runs')return send(res,200,{runs:await listRuns()});
   if(req.method==='GET'&&url.pathname.startsWith('/runs/'))return send(res,200,{run:await getRun(url.pathname.slice('/runs/'.length))});
   if(req.method!=='POST'||url.pathname!=='/tasks')return send(res,404,{error:'not_found'});
   const raw=await body(req);
   const rawText=JSON.stringify(raw);
   if(!validSignature(req,rawText))return send(res,401,{status:'BLOCKED_PERMISSION',error:'signed_task_required'});
   const task=createTask(raw);
   const run=await createRun(task);
   runInBackground(run,task,raw).catch(()=>{});
   return send(res,202,{taskId:task.taskId,runId:run.runId,state:'QUEUED',message:'Task accepted for background execution; poll the run for evidence.'});
  }catch(error){return send(res,error.status||500,{status:'FAILED',error:error.message||'operator_error'});}
 });
}
if(import.meta.url===`file://${process.argv[1]}`)createServer().listen(port,host,()=>console.log(JSON.stringify({service:'ai-operating-operator',host,port})));
