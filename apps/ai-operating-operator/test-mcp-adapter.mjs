import assert from 'node:assert/strict';
import {runMcp,verifyMcpResult} from './adapters/mcp-adapter.mjs';

const env={OPERATOR_MCP_URL:'https://mcp.example.test'};
const badEnv={OPERATOR_MCP_URL:'http://remote.example.test'};
let rejected=false; try{await runMcp({task:{allowedActions:['mcp_read']},action:'health'},badEnv)}catch(e){rejected=e.message==='mcp_https_required'} assert.equal(rejected,true);
const oldFetch=globalThis.fetch;
globalThis.fetch=async (_url,opts)=>({status:200,ok:true,text:async()=>JSON.stringify({jsonrpc:'2.0',id:JSON.parse(opts.body).id,result:{tools:[]}})});
try{
  const task={taskId:'mcp-contract',allowedActions:['mcp_read']};
  const health=await runMcp({task,action:'health'},env);
  assert.equal(verifyMcpResult({result:health}).passed,true);
  const listed=await runMcp({task,action:'list_tools'},env);
  assert.equal(listed.result.data.result.tools.length,0);
  const called=await runMcp({task,action:'call_tool',tool:'demo',arguments:{x:1}},env);
  assert.equal(verifyMcpResult({result:called,action:'call_tool'}).passed,true);
  let denied=false; try{await runMcp({task:{allowedActions:[]},action:'list_tools'},env)}catch(e){denied=e.message==='mcp_read_authorization_required'}
  assert.equal(denied,true);
  console.log('mcp adapter contract PASS');
}finally{globalThis.fetch=oldFetch}
