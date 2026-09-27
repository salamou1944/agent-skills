const ALLOWED_ACTIONS=new Set(['validate_openapi','inspect_operations','generate_bounded_tools']);
function parseSpec(input){
  const spec=input?.openapiDocument ?? input?.spec;
  if(!spec || typeof spec!=='object' || Array.isArray(spec)) throw new Error('openapi_document_required');
  if(typeof spec.openapi!=='string' || !/^3\.(0|1|2)(\.|$)/.test(spec.openapi)) throw new Error('openapi_3_required');
  if(!spec.info || typeof spec.info.title!=='string') throw new Error('openapi_info_required');
  if(!spec.paths || typeof spec.paths!=='object' || Array.isArray(spec.paths)) throw new Error('openapi_paths_required');
  return spec;
}
function operations(spec){
  const methods=new Set(['get','post','put','patch','delete','head','options','trace']); const out=[];
  for(const [route,item] of Object.entries(spec.paths)){
    if(!item || typeof item!=='object') continue;
    for(const [method,op] of Object.entries(item)){
      if(!methods.has(method)||!op||typeof op!=='object') continue;
      out.push({method:method.toUpperCase(),path:route,operationId:op.operationId||null,summary:op.summary||op.description||null});
    }
  }
  return out.slice(0,200);
}
function hostAllowed(host,allowlist){const list=String(allowlist||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return list.includes(host.toLowerCase());}
function boundedTools(spec,input){
  const allowedHosts=String(input.allowedHosts||'').trim(); const servers=Array.isArray(spec.servers)?spec.servers.map(s=>s?.url).filter(Boolean):[]; const hosts=[];
  for(const raw of servers){try{const u=new URL(raw);if(u.protocol!=='https:') continue;if(allowedHosts&&!hostAllowed(u.hostname,allowedHosts)) continue;hosts.push(u.hostname)}catch{}}
  return operations(spec).map((op,i)=>({toolId:'openapi-'+(i+1),name:op.operationId||op.method.toLowerCase()+'_'+(i+1),method:op.method,path:op.path,servers:hosts,requiresExplicitHostAllowlist:true,readOnly:['GET','HEAD','OPTIONS'].includes(op.method)}));
}
export async function runOpenApiMcp(input){
  const task=input.task||{}; const action=String(input.action||'validate_openapi');
  if(!ALLOWED_ACTIONS.has(action)) throw new Error('action_not_allowed');
  if(!(task.allowedActions||[]).includes('openapi_mcp_read')) throw new Error('openapi_mcp_read_not_authorized');
  const spec=parseSpec(input); const ops=operations(spec); const base={status:200,action,title:spec.info.title,openapi:spec.openapi,operationCount:ops.length};
  if(action==='validate_openapi') return {executionId:'openapi-'+(task.taskId||Date.now()),target:'inline-openapi-document',result:base};
  if(action==='inspect_operations') return {executionId:'openapi-'+(task.taskId||Date.now()),target:'inline-openapi-document',result:{...base,operations:ops}};
  return {executionId:'openapi-'+(task.taskId||Date.now()),target:'inline-openapi-document',result:{...base,tools:boundedTools(spec,input)}};
}
export function verifyOpenApiMcpResult({result}){const passed=Boolean(result&&result.executionId&&result.target&&result.result?.status===200&&Number.isInteger(result.result.operationCount));return {verifierId:'openapi-mcp-independent-verifier-v1',passed,errors:passed?[]:['invalid_openapi_mcp_result']};}
