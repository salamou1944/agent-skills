import assert from 'node:assert/strict';
import {runCapabilitySources,verifyCapabilitySourcesResult} from './adapters/capability-sources-adapter.mjs';

const task={allowedActions:['capability_sources_read']};
const health=await runCapabilitySources({task,action:'health'});
const hv=verifyCapabilitySourcesResult({result:health});
assert.equal(hv.passed,true);
assert.equal(health.result.sourceCount,5);

const sources=await runCapabilitySources({task,action:'sources'});
assert.equal(sources.result.status,200);
assert.equal(sources.result.sources.length,5);

for(const source of ['agent_zero','agentic_ai_apis','ai_engineering_from_scratch','awesome_free_llm_apis']){
  const s=await runCapabilitySources({task,action:'inspect',source,file:undefined,maxBytes:1200});
  assert.equal(s.result.status,200);
  assert.ok(s.result.sourceRevision);
}

const found=await runCapabilitySources({task,action:'search',source:'agentic_ai_apis',file:'README.md',query:'MCP',limit:5});
assert.equal(found.result.status,200);
assert.ok(found.result.sourceRevision);
assert.ok(found.result.count>0);

let denied=false;
try{await runCapabilitySources({task:{allowedActions:[]},action:'sources'});}
catch(e){denied=e.message==='capability_sources_read_not_authorized';}
assert.equal(denied,true);

console.log(JSON.stringify({ok:true,sourceCount:health.result.sourceCount,searchCount:found.result.count}));
