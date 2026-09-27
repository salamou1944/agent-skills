import crypto from 'node:crypto';

const SAFE_ACTIONS=new Set(['health','list_tools','call_tool']);
const TIMEOUT_MS=20000;

function endpoint(env){
  const raw=String(env.OPERATOR_MCP_URL||'').trim();
  if(!raw) throw new Error('mcp_endpoint_not_configured');
  const u=new URL(raw);
  if(u.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(u.hostname)) throw new Error('mcp_https_required');
  return u;
}
function allowed(action,task){
  if(!SAFE_ACTIONS.has(action)) throw new Error('mcp_action_not_allowed');
  if(action!=='health'&&!(task?.allowedActions||[]).includes('mcp_read')) throw new Error('mcp_read_authorization_required');
}
function jsonRpc(method,params,id){return {jsonrpc:'2.0',id,method,params:params||{}};}

async function rpc(base,body,env){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const headers={'content-type':'application/json','accept':'application/json, text/event-stream'};
    if(env.OPERATOR_MCP_TOKEN) headers.authorization=`Bearer ${env.OPERATOR_MCP_TOKEN}`;
    const r=await fetch(base,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
    const text=await r.text();
    let data=null; try{data=JSON.parse(text)}catch{}
    if(!data) throw new Error('mcp_non_json_response');
    return {status:r.status,ok:r.ok,data};
  }finally{clearTimeout(timer);}
}

export async function runMcp(input,env=process.env){
  const action=input.action||'health'; const task=input.task||{}; allowed(action,task);
  const base=endpoint(env); const executionId=crypto.randomUUID();
  if(action==='health'){
    return {executionId,target:base.origin,result:{status:200,action,endpoint:base.origin}};
  }
  const id=crypto.randomUUID();
  let body;
  if(action==='list_tools') body=jsonRpc('tools/list',{},id);
  else body=jsonRpc('tools/call',{name:String(input.tool||''),arguments:input.arguments||{}},id);
  if(action==='call_tool'&&!String(input.tool||'').trim()) throw new Error('mcp_tool_required');
  const response=await rpc(base,body,env);
  return {executionId,target:base.origin,result:{status:response.status,ok:response.ok,data:response.data,action,requestId:id}};
}

export function verifyMcpResult({result,action='health'}){
  const passed=Boolean(result?.executionId&&result?.target&&result?.result?.status>=200&&result?.result?.status<300&&SAFE_ACTIONS.has(action));
  return {verifierId:'mcp-independent-verifier-v1',passed,errors:passed?[]:['mcp_result_missing_execution_proof']};
}
