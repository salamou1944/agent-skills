import {runApiCatalog,verifyApiCatalogResult} from './adapters/api-catalog-adapter.mjs';

const task={allowedActions:['api_catalog_read']};
const health=await runApiCatalog({task,action:'health'});
const hv=verifyApiCatalogResult({result:health,action:'health'});
if(!hv.passed) throw new Error('health_verifier_failed');

const found=await runApiCatalog({task,action:'search',category:'recommended',query:'MCP',limit:5});
const fv=verifyApiCatalogResult({result:found,action:'search'});
if(!fv.passed || found.result.count<1) throw new Error('search_contract_failed');

let denied=false;
try{await runApiCatalog({task:{allowedActions:[]},action:'search',category:'recommended',query:'MCP'});}
catch(e){denied=e.message==='api_catalog_read_not_authorized';}
if(!denied) throw new Error('authorization_gate_failed');

console.log(JSON.stringify({ok:true,health:hv,search:fv,count:found.result.count}));
