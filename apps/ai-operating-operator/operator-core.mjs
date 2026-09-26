import crypto from 'node:crypto';

export const STATES=Object.freeze(['REQUESTED','AUTHORIZED','PLANNED','EXECUTING','EVIDENCE_CAPTURED','VERIFIED','AUTH_REQUIRED','BLOCKED_PERMISSION','BLOCKED_EXTERNAL_DEPENDENCY','REVIEW_REQUIRED','VERIFICATION_FAILED','FAILED']);
const WRITE=new Set(['write','merge','deploy','delete','production-mutation','credential-change']);

export function createTask(input={}){
  const goal=String(input.goal||'').trim(); if(!goal) throw new Error('goal_required');
  return {version:'ai-operating-task-v1',taskId:input.taskId||crypto.randomUUID(),createdAt:new Date().toISOString(),mediator:'chatgpt',project:input.project||null,goal,constraints:Array.isArray(input.constraints)?input.constraints:[],requestedCapabilities:Array.isArray(input.requestedCapabilities)?input.requestedCapabilities:[],allowedActions:Array.isArray(input.allowedActions)?input.allowedActions:[],sourceRevision:input.sourceRevision||null,idempotencyKey:input.idempotencyKey||null,state:'REQUESTED',completionClaimAllowed:false};
}

export function assessCapabilities(task,capabilities={}){
  const required=task.requestedCapabilities.length?task.requestedCapabilities:['local'];
  const results=required.map(name=>{const c=capabilities[name];if(!c)return{name,status:'BLOCKED_PERMISSION',reason:'capability_not_registered'};if(c.authorized!==true)return{name,status:'BLOCKED_PERMISSION',reason:'not_authorized'};if(c.reachable!==true)return{name,status:'BLOCKED_EXTERNAL_DEPENDENCY',reason:'not_reachable'};return{name,status:'AVAILABLE',read:!!c.canRead,write:!!c.canWrite,deploy:!!c.canDeploy}});
  return {ok:results.every(x=>x.status==='AVAILABLE'),results};
}

export function authorizeAction(task,action,capability){
  if(WRITE.has(action)&&task.constraints.includes('no-mutation'))return{ok:false,state:'REVIEW_REQUIRED',reason:'task_disallows_mutation'};
  if(!capability||capability.authorized!==true)return{ok:false,state:'BLOCKED_PERMISSION',reason:'capability_not_authorized'};
  if(action==='read'&&capability.canRead!==true)return{ok:false,state:'BLOCKED_PERMISSION',reason:'read_not_allowed'};
  if(action==='write'&&capability.canWrite!==true)return{ok:false,state:'BLOCKED_PERMISSION',reason:'write_not_allowed'};
  if(action==='deploy'&&capability.canDeploy!==true)return{ok:false,state:'BLOCKED_PERMISSION',reason:'deploy_not_allowed'};
  if(WRITE.has(action)&&task.constraints.includes('approval-required'))return{ok:false,state:'REVIEW_REQUIRED',reason:'explicit_approval_required'};
  return{ok:true,state:'AUTHORIZED'};
}

export function nextState(current,event){
  const m={REQUESTED:{authorize:'AUTHORIZED',block_permission:'BLOCKED_PERMISSION',auth_required:'AUTH_REQUIRED'},AUTHORIZED:{plan:'PLANNED',block_permission:'BLOCKED_PERMISSION'},PLANNED:{execute:'EXECUTING',review:'REVIEW_REQUIRED'},EXECUTING:{evidence:'EVIDENCE_CAPTURED',blocked:'BLOCKED_EXTERNAL_DEPENDENCY',failed:'FAILED'},EVIDENCE_CAPTURED:{verify:'VERIFIED',reject:'VERIFICATION_FAILED',review:'REVIEW_REQUIRED'}};
  const target=m[current]?.[event]; if(!target)throw new Error('invalid_transition:'+current+':'+event); return target;
}

export function evidence(kind,details={}){
  return {evidenceId:crypto.randomUUID(),kind,capturedAt:new Date().toISOString(),...sanitize(details)};
}
function sanitize(v){
  if(v==null||typeof v==='number'||typeof v==='boolean')return v;
  if(typeof v==='string')return v.replace(/Bearer\s+[^\s]+/gi,'Bearer [REDACTED]');
  if(Array.isArray(v))return v.map(sanitize);
  const o={};for(const[k,x]of Object.entries(v)){o[k]=/token|secret|password|api.?key|private.?key|credential/i.test(k)?'[REDACTED]':sanitize(x)}return o;
}
export function verifyCompletion(task,report){
  const errors=[]; if(!report||report.taskId!==task.taskId)errors.push('task_mismatch');
  if(report?.state!=='EVIDENCE_CAPTURED')errors.push('evidence_not_captured');
  if(report?.verification?.passed!==true)errors.push('verification_not_passed');
  if(!report?.evidence?.some(x=>x.kind==='action'))errors.push('action_evidence_missing');
  if(!report?.evidence?.some(x=>x.kind==='verification'))errors.push('verification_evidence_missing');
  const i=report?.evidence?.find(x=>x.kind==='independent_verification');if(!i||i.verifierId==='planner')errors.push('independent_verifier_missing');
  return {ok:errors.length===0,errors};
}
export function finalize(task,report){const v=verifyCompletion(task,report);return v.ok?{...report,state:'VERIFIED',verification:v,claims:{success:true}}:{...report,state:'VERIFICATION_FAILED',verification:v,claims:{success:false}};}
export function capabilitySnapshot(env=process.env,observed={}){
  const has=x=>!!env[x], mk=(key,deploy=false)=>({configured:has(key),authorized:has(key),reachable:observed[key]?.reachable===true,canRead:observed[key]?.canRead===true,canWrite:observed[key]?.canWrite===true,canDeploy:deploy&&observed[key]?.canDeploy===true});
  return {github:mk('GITHUB_TOKEN'),railway:mk('RAILWAY_TOKEN',true),vercel:mk('VERCEL_TOKEN',true),supabase:mk('SUPABASE_ACCESS_TOKEN',true),browser:mk('OPERATOR_BROWSER_SESSION'),local:{configured:has('OPERATOR_WORKSPACE'),authorized:has('OPERATOR_WORKSPACE'),reachable:has('OPERATOR_WORKSPACE'),canRead:has('OPERATOR_WORKSPACE'),canWrite:has('OPERATOR_WORKSPACE'),canDeploy:false}};
}