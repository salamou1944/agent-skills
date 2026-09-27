import {runApiCatalog,verifyApiCatalogResult} from './adapters/api-catalog-adapter.mjs';

const task={allowedActions:['api_catalog_read']};
const health=await runApiCatalog({task,action:'health'});
const hv=verifyApiCatalogResult({result:health,action:'health'});
if(!hv.passed || health.result.sourceRevision!=='3afa19dd12f3cdc6bc2e297e9b6945059ada0cae') throw new Error('health_provenance_failed');
if(!(health.result.bytes>0)) throw new Error('health_fetch_failed');

const found=await runApiCatalog({task,action:'search',category:'recommended',query:'MCP',limit:5});
const ai=await runApiCatalog({task,action:'category',category:'ai',limit:3});
const agents=await runApiCatalog({task,action:'search',category:'agents',query:'MCP',limit:5});
const fv=verifyApiCatalogResult({result:found,action:'search'});
if(!fv.passed || found.result.count<1) throw new Error('search_contract_failed');
if(ai.result.count<1 || agents.result.count<1) throw new Error('category_coverage_failed');
if(!found.result.results.every(x=>x.name && x.description && ('url' in x))) throw new Error('structured_result_failed');
if(!found.result.results.some(x=>/MCP/i.test(x.name+' '+x.description))) throw new Error('mcp_catalog_gap');

let denied=false;
try{await runApiCatalog({task:{allowedActions:[]},action:'search',category:'recommended',query:'MCP'});}
catch(e){denied=e.message==='api_catalog_read_not_authorized';}
if(!denied) throw new Error('authorization_gate_failed');

console.log(JSON.stringify({
  ok:true,
  health:hv,
  search:fv,
  counts:{recommended:found.result.count,ai:ai.result.count,agentsMcp:agents.result.count},
  sample:found.result.results[0]
}));
