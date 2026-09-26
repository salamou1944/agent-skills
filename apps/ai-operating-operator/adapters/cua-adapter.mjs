import crypto from 'node:crypto';

const SAFE_ACTIONS=new Set(['health','list_apps','screenshot','inspect','verify_visible_result','cleanup']);

function baseUrl(env){
  const raw=String(env.OPERATOR_CUA_URL||'').trim();
  if(!raw)throw new Error('cua_endpoint_required');
  const u=new URL(raw);
  if(u.protocol!=='https:')throw new Error('cua_https_required');
  return u;
}

function allowedAction(action,task){
  if(!SAFE_ACTIONS.has(action))throw new Error('cua_action_not_registered');
  if(action!=='health' && (!Array.isArray(task?.allowedActions)||!task.allowedActions.includes('cua_read'))){
    throw new Error('cua_read_not_authorized');
  }
}

export async function runCua(input={},env=process.env){
  const action=String(input.action||'health');
  allowedAction(action,input.task);
  const base=baseUrl(env);
  const token=String(env.OPERATOR_CUA_TOKEN||'').trim();
  const headers={'accept':'application/json','content-type':'application/json'};
  if(token)headers.authorization='Bearer '+token;
  const url=new URL('/v1/'+action,base);
  const body={taskId:input.task?.taskId||null,action,permissionMode:input.permissionMode||'standard',manifestHash:input.manifestHash||null,arguments:input.arguments||{}};
  const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  let data=null;try{data=await r.json();}catch{}
  return {
    executionId:crypto.randomUUID(),
    adapter:'platform.cua.driver',
    action,
    target:base.host,
    status:r.status,
    ok:r.ok,
    result:{status:r.status,code:r.status,action,data}
  };
}
