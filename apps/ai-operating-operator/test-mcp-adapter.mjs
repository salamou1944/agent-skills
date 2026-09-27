import assert from 'node:assert/strict';
import {runMcp,verifyMcpResult} from './adapters/mcp-adapter.mjs';

const env={OPERATOR_MCP_URL:'https://mcp.example.test'};
const oldFetch=globalThis.fetch;
globalThis.fetch=async (_url,opts)=>({status:200,ok:true,text:async()=>JSON.stringify({jsonrpc:'2.0',id:JSON.parse(opts.body).id,result:{tools:[]}})});
try{
  const task={taskId:'mcp-contract',allowedActions:['mcp_read','mcp_execute'],allowedMcpTools:['demo']};
  const health=await runMcp({task,action:'health'},env);
  assert.equal(verifyMcpResult({result:health}).passed,true);
  const listed=await runMcp({task,action:'list_tools'},env);
  assert.equal(listed.result.data.result.tools.length,0);
  const called=await runMcp({task,action:'call_tool',tool:'demo',arguments:{x:1}},env);
  assert.equal(verifyMcpResult({result:called,action:'call_tool'}).passed,true);
  let toolDenied=false; try{await runMcp({task:{allowedActions:['mcp_read','mcp_execute'],allowedMcpTools:[]},action:'call_tool',tool:'demo'},env)}catch(e){toolDenied=e.message==='mcp_tool_not_allowlisted'} assert.equal(toolDenied,true);
  let execDenied=false; try{await runMcp({task:{allowedActions:['mcp_read'],allowedMcpTools:['demo']},action:'call_tool',tool:'demo'},env)}catch(e){execDenied=e.message==='mcp_execute_authorization_required'} assert.equal(execDenied,true);
  let denied=false; try{await runMcp({task:{allowedActions:[]},action:'list_tools'},env)}catch(e){denied=e.message==='mcp_read_authorization_required'}
  assert.equal(denied,true);
  console.log('mcp adapter contract PASS');
}finally{globalThis.fetch=oldFetch}
