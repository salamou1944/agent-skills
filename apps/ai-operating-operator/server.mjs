import http from 'node:http';
import crypto from 'node:crypto';
import {createTask,capabilitySnapshot,assessCapabilities,evidence} from './operator-core.mjs';

const port=Number(process.env.OPERATOR_PORT||8788);
const host=process.env.OPERATOR_HOST||'127.0.0.1';
const hmac=process.env.OPERATOR_HMAC_SECRET||'';

function send(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>200000)throw Object.assign(new Error('body_too_large'),{status:413})}return s?JSON.parse(s):{}}
function validSignature(req,raw){if(!hmac)return false;const supplied=String(req.headers['x-operator-signature']||'');const expected=crypto.createHmac('sha256',hmac).update(raw).digest('hex');return supplied.length===expected.length&&crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));}

export function createServer(){
 return http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
   if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{status:'READY',service:'ai-operating-operator',mediator:'chatgpt',mode:'fail-closed'});
   if(req.method==='GET'&&url.pathname==='/capabilities')return send(res,200,{capabilities:capabilitySnapshot()});
   if(req.method!=='POST'||url.pathname!=='/tasks')return send(res,404,{error:'not_found'});
   const raw=await body(req);
   const rawText=JSON.stringify(raw);
   if(!validSignature(req,rawText))return send(res,401,{status:'BLOCKED_PERMISSION',error:'signed_task_required'});
   const task=createTask(raw);
   const capabilityResult=assessCapabilities(task,capabilitySnapshot());
   if(!capabilityResult.ok){
    const blocked=capabilityResult.results.find(x=>x.status!=='AVAILABLE');
    return send(res,403,{taskId:task.taskId,state:blocked.status,reason:blocked.reason,capabilities:capabilityResult.results,evidence:[evidence('task_acceptance',{accepted:false})]});
   }
   return send(res,202,{taskId:task.taskId,state:'AUTHORIZED',message:'Task accepted by the operator boundary; execution adapter must now run and independently verify it.',evidence:[evidence('task_acceptance',{accepted:true,project:task.project})]});
  }catch(error){return send(res,error.status||500,{status:'FAILED',error:error.message||'operator_error'});}
 });
}
if(import.meta.url===`file://${process.argv[1]}`)createServer().listen(port,host,()=>console.log(JSON.stringify({service:'ai-operating-operator',host,port})));
