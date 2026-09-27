const SOURCE='https://raw.githubusercontent.com/cporter202/openclaw-api-list/main/';

const CATEGORY_FILES={
  recommended:'OPENCLAW_RECOMMENDED.md',
  mcp:'mcp-servers-apis-131/README.md',
  integrations:'integrations-apis-890/README.md',
  automation:'automation-apis-4825/README.md',
  open_source:'open-source-apis-768/README.md'
};

const ALLOWED_ACTIONS=new Set(['health','search','category']);

function assertSafeUrl(u){
  const url=new URL(u);
  if(url.protocol!=='https:') throw new Error('https_required');
  if(url.hostname!=='raw.githubusercontent.com') throw new Error('source_not_allowlisted');
  return url;
}

async function getText(url,timeoutMs=15000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(assertSafeUrl(url),{signal:controller.signal,headers:{'accept':'text/plain'}});
    if(!res.ok) throw new Error(`catalog_http_${res.status}`);
    return await res.text();
  }finally{clearTimeout(timer);}
}

function rows(markdown){
  const out=[];
  for(const line of markdown.split('\n')){
    if(!/^\|/.test(line) || /^\|\s*-+/.test(line)) continue;
    const m=line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|/);
    if(!m || /^api name$/i.test(m[1])) continue;
    out.push({name:m[1],description:m[2]});
  }
  return out.filter(r=>r.name && r.description);
}

function searchRows(markdown,query,limit=20){
  const q=String(query||'').trim().toLowerCase();
  if(!q) throw new Error('query_required');
  const terms=q.split(/\s+/).filter(Boolean);
  return rows(markdown).filter(r=>terms.every(t=>(r.name+' '+r.description).toLowerCase().includes(t))).slice(0,limit);
}

export async function runApiCatalog(input){
  const task=input.task||{};
  const action=input.action||'health';
  if(!ALLOWED_ACTIONS.has(action)) throw new Error('action_not_allowed');
  if(action!=='health' && !(task.allowedActions||[]).includes('api_catalog_read')) throw new Error('api_catalog_read_not_authorized');

  if(action==='health'){
    return {executionId:`api-catalog-${Date.now()}`,target:'cporter202/openclaw-api-list',result:{status:200,source:'openclaw-api-list',mode:'read_only'}};
  }

  const category=String(input.category||'recommended');
  const file=CATEGORY_FILES[category];
  if(!file) throw new Error('category_not_supported');
  const markdown=await getText(SOURCE+file);
  const limit=Math.min(Math.max(Number(input.limit||20),1),50);
  const results=action==='category' ? rows(markdown).slice(0,limit) : searchRows(markdown,input.query,limit);

  return {
    executionId:`api-catalog-${Date.now()}`,
    target:`cporter202/openclaw-api-list:${file}`,
    result:{status:200,action,category,count:results.length,results,sourceRevision:'main'}
  };
}

export function verifyApiCatalogResult({result}){
  const ok=Boolean(result && result.result && result.result.status===200 && result.executionId && result.target);
  return {verifierId:'api-catalog-independent-verifier-v1',passed:ok,errors:ok?[]:['missing_valid_catalog_execution']};
}
