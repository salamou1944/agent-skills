import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

export function validateTarget(target, allowlist=[]){
  const value=String(target||'').trim();
  if(!value) throw new Error('target_required');
  if(!Array.isArray(allowlist)||!allowlist.includes(value)) throw new Error('target_not_authorized');
  return value;
}

export function buildNmapArgs({target,allowlist,ports='1-1024',serviceDetection=false}={}){
  const t=validateTarget(target,allowlist);
  if(!/^[A-Za-z0-9._:/-]+$/.test(t)) throw new Error('target_format_rejected');
  if(!/^\d{1,5}(-\d{1,5})?(,\d{1,5}(-\d{1,5})?)*$/.test(String(ports))) throw new Error('ports_format_rejected');
  const args=['-Pn','-n','-p',String(ports)];
  if(serviceDetection) args.push('-sV');
  args.push(t);
  return args;
}

export async function runNmap({target,allowlist,ports,serviceDetection=false,command='nmap',timeoutMs=120000,runner=spawn}={}){
  const args=buildNmapArgs({target,allowlist,ports,serviceDetection});
  const startedAt=new Date().toISOString();
  const executionId=crypto.randomUUID();
  return await new Promise((resolve)=>{
    const child=runner(command,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='',settled=false;
    const finish=(result)=>{if(settled)return;settled=true;resolve({executionId,startedAt,finishedAt:new Date().toISOString(),target,args,command,result});};
    const timer=setTimeout(()=>{try{child.kill('SIGTERM')}catch{};finish({status:'failed',reason:'timeout',code:null,stdout,stderr})},timeoutMs);
    child.stdout?.on('data',d=>stdout+=d);
    child.stderr?.on('data',d=>stderr+=d);
    child.on('error',e=>{clearTimeout(timer);finish({status:'failed',reason:e.code||e.message,code:null,stdout,stderr})});
    child.on('close',(code,signal)=>{clearTimeout(timer);finish({status:code===0?'completed':'failed',reason:signal||null,code,stdout,stderr})});
  });
}
