import assert from 'node:assert/strict';
import {runOpenApi,verifyOpenApiResult} from './adapters/openapi-mcp-adapter.mjs';

const spec={openapi:'3.0.3',info:{title:'Demo'},servers:[{url:'https://api.example.com'}],paths:{
  '/items':{get:{operationId:'listItems',summary:'List items',parameters:[{name:'limit',in:'query',required:false,schema:{type:'integer'}}]}}
}};
await assert.rejects(()=>runOpenApi({action:'inspect',spec,task:{taskId:'t',allowedActions:[]}}),/api_schema_read_not_authorized/);
const result=await runOpenApi({action:'inspect',spec,task:{taskId:'t',allowedActions:['api_schema_read']}});
assert.equal(result.result.operations[0].operationId,'listItems');
assert.equal(verifyOpenApiResult({result}).passed,true);
assert.equal(verifyOpenApiResult({result:{executionId:'e',status:200,ok:true,action:'execute',result:{operations:[]}}}).passed,false);
console.log('openapi/mcp discovery adapter contract tests: PASS');
