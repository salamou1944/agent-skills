import assert from 'node:assert/strict';
import {runOpenApiMcp,verifyOpenApiMcpResult} from './adapters/openapi-mcp-adapter.mjs';
const spec={openapi:'3.0.3',info:{title:'Demo API',version:'1.0.0'},servers:[{url:'https://api.example.test'}],paths:{'/health':{get:{operationId:'health'}},'/items':{post:{operationId:'createItem'}}}};
const task={taskId:'openapi-contract',allowedActions:['openapi_mcp_read']};
const v=await runOpenApiMcp({task,action:'validate_openapi',openapiDocument:spec}); assert.equal(verifyOpenApiMcpResult({result:v}).passed,true); assert.equal(v.result.operationCount,2);
const i=await runOpenApiMcp({task,action:'inspect_operations',openapiDocument:spec}); assert.equal(i.result.operations.length,2);
const g=await runOpenApiMcp({task,action:'generate_bounded_tools',openapiDocument:spec,allowedHosts:'api.example.test'}); assert.equal(g.result.tools.length,2); assert.equal(g.result.tools[0].requiresExplicitHostAllowlist,true);
let denied=false;try{await runOpenApiMcp({task:{allowedActions:[]},action:'validate_openapi',openapiDocument:spec});}catch(e){denied=e.message==='openapi_mcp_read_not_authorized';} assert.equal(denied,true);
console.log('openapi mcp adapter contract PASS');
