import crypto from 'node:crypto';

const SAFE_ACTIONS=new Set(['inspect']);
function fail(message){throw new Error(message);}
function bounded(value,max=100){return Array.isArray(value)?value.slice(0,max):[];}

function inspectOpenApi(spec){
  if(!spec||typeof spec!=='object')fail('openapi_spec_invalid');
  if(!spec.openapi&&!(spec.swagger&&String(spec.swagger).startsWith('2.')))fail('openapi_version_unsupported');
  const paths=spec.paths&&typeof spec.paths==='object'?spec.paths:{};
  const operations=[];
  for(const [route,item] of Object.entries(paths).slice(0,200)){
    if(!item||typeof item!=='object')continue;
    for(const method of ['get','post','put','patch','delete','head','options']){
      const op=item[method];
      if(!op||typeof op!=='object')continue;
      operations.push({
        operationId:typeof op.operationId==='string'&&op.operationId?op.operationId:`${method.toUpperCase()}_${route.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'')||'root'}`,
        method:method.toUpperCase(),
        path:route,
        summary:typeof op.summary==='string'?op.summary.slice(0,300):undefined,
        parameters:bounded(op.parameters).map(p=>({name:p?.name,in:p?.in,required:Boolean(p?.required),schema:p?.schema?{type:p.schema.type,format:p.schema.format}:undefined})),
        hasRequestBody:Boolean(op.requestBody),
        hasSecurity:Boolean(op.security||spec.security)
      });
    }
  }
  return {
    schemaVersion:spec.openapi||spec.swagger,
    title:typeof spec.info?.title==='string'?spec.info.title.slice(0,200):undefined,
    servers:bounded(spec.servers).map(s=>typeof s?.url==='string'?s.url:null).filter(Boolean).slice(0,10),
    operations:operations.slice(0,500),
    truncated:Object.keys(paths).length>200||operations.length>500
  };
}

export async function runOpenApi(input){
  const action=input.action||'inspect';
  if(!SAFE_ACTIONS.has(action))fail('openapi_action_not_allowed');
  if(!input.task?.allowedActions?.includes('api_schema_read'))fail('api_schema_read_not_authorized');
  const spec=input.spec;
  const manifest=inspectOpenApi(spec);
  return {executionId:crypto.randomUUID(),action,status:200,ok:true,result:manifest};
}

export function verifyOpenApiResult({result}){
  const errors=[];
  if(!result?.executionId)errors.push('missing_execution_id');
  if(result?.status!==200||result?.ok!==true)errors.push('execution_not_successful');
  if(result?.action!=='inspect')errors.push('unsafe_action');
  if(!result?.result||!Array.isArray(result.result.operations))errors.push('missing_operation_manifest');
  return {verifierId:'openapi-mcp-independent-verifier-v1',passed:errors.length===0,errors};
}
