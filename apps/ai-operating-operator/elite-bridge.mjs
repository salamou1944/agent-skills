import crypto from 'node:crypto';
import {createTask,evidence,verifyCompletion} from './operator-core.mjs';

const DEFAULT_TIMEOUT_MS=Number(process.env.ELITE_TIMEOUT_MS||120000);

function endpoint(){
  return String(process.env.ELITE_EXECUTOR_URL||'').trim().replace(/\/$/,'');
}

function headers(){
  const h={'content-type':'application/json','accept':'application/json'};
  const token=String(process.env.ELITE_EXECUTOR_TOKEN||'').trim();
  if(token) h.authorization=`Bearer ${token}`;
  return h;
}

function safeUrl(value){
  const u=new URL(value);
  if(u.protocol!=='https:' && u.hostname!=='localhost' && u.hostname!=='127.0.0.1') throw new Error('elite_endpoint_must_be_https');
  return u;
}

export function getEliteBridgeStatus(){
  const url=endpoint();
  if(!url) return {configured:false,authorized:false,reachable:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'ELITE_EXECUTOR_URL_missing'};
  try{
    const u=safeUrl(url);
    return {configured:true,authorized:Boolean(process.env.ELITE_EXECUTOR_TOKEN),reachable:null,endpoint:`${u.origin}${u.pathname}`,state:'CONFIGURED_NOT_VERIFIED'};
  }catch(error){
    return {configured:true,authorized:false,reachable:false,state:'FAILED',reason:error.message};
  }
}

export async function dispatchToElite(input={},{fetchImpl=fetch,timeoutMs=DEFAULT_TIMEOUT_MS}={}){
  const url=endpoint();
  if(!url) return {ok:false,state:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'ELITE_EXECUTOR_URL_missing'};
  const task=createTask(input);
  const target=safeUrl(url);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  const executionId=crypto.randomUUID();
  try{
    const response=await fetchImpl(target,{method:'POST',headers:headers(),body:JSON.stringify({
      protocol:'ai-operating-elite-v1',
      executionId,
      task
    }),signal:controller.signal});
    const body=await response.text();
    let result;
    try{result=JSON.parse(body);}catch{result={raw:body.slice(0,4000)};}
    const action=evidence('elite_dispatch',{
      executionId,
      endpoint:`${target.origin}${target.pathname}`,
      httpStatus:response.status,
      accepted:response.ok,
      eliteState:result?.state||result?.status||null
    });
    if(!response.ok) return {ok:false,state:response.status===401||response.status===403?'BLOCKED_PERMISSION':'FAILED',taskId:task.taskId,executionId,evidence:[action],result};
    const verification=result?.verification||null;
    const report={
      taskId:task.taskId,
      state:'EVIDENCE_CAPTURED',
      evidence:[action,...(Array.isArray(result?.evidence)?result.evidence:[])],
      verification
    };
    return {...report,completion:verifyCompletion(task,report),result};
  }catch(error){
    const reason=error?.name==='AbortError'?'elite_timeout':String(error?.message||error);
    return {ok:false,state:reason==='elite_timeout'?'BLOCKED_EXTERNAL_DEPENDENCY':'FAILED',taskId:task.taskId,executionId,evidence:[evidence('elite_dispatch',{executionId,accepted:false,reason})],reason};
  }finally{clearTimeout(timer);}
}
