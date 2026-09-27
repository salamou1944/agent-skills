const SOURCES=Object.freeze({
  agent_zero:{
    repo:'agent0ai/agent-zero',
    revision:'e3051fb584b1a36be2b0a0c90606f1c2c2d356ec',
    files:['README.md','docs/guides/skills.md','docs/guides/mcp-setup.md'],
    purpose:'agent workspace, browser, projects, memory, skills, plugins, host bridge, multi-agent patterns'
  },
  openclaw_api_list:{
    repo:'cporter202/openclaw-api-list',
    revision:'3afa19dd12f3cdc6bc2e297e9b6945059ada0cae',
    files:['OPENCLAW_RECOMMENDED.md','agents-apis-697/README.md','ai-apis-1208/README.md','mcp-servers-apis-131/README.md'],
    purpose:'broad API discovery'
  },
  agentic_ai_apis:{
    repo:'cporter202/agentic-ai-apis',
    revision:'64459d7bc2887f034ae5588d9bbd03e3c1d3c5a4',
    files:['README.md','agents-apis/README.md','ai-models-apis/README.md','mcp-servers-apis/README.md'],
    purpose:'agents, AI models and MCP discovery'
  },
  ai_engineering_from_scratch:{
    repo:'rohitg00/ai-engineering-from-scratch',
    revision:'968da0791b83917c9d8a5ba197ff190fa0b24093',
    files:['README.md','phases/13-tools-and-protocols/README.md','phases/14-agent-engineering/README.md'],
    purpose:'engineering patterns, MCP, agent skills, evaluation and evidence'
  },
  awesome_free_llm_apis:{
    repo:'mnfst/awesome-free-llm-apis',
    revision:'167013ff729e30f3a92bb8d416062d6c34a84507',
    files:['README.md'],
    purpose:'free-tier LLM provider discovery and subscription alternatives'
  }
});

const ALLOWED_ACTIONS=new Set(['health','sources','inspect','search']);

function assertSafeUrl(u,source){
  const url=new URL(u);
  if(url.protocol!=='https:') throw new Error('https_required');
  if(url.hostname!=='raw.githubusercontent.com') throw new Error('source_not_allowlisted');
  const prefix='/'+source.repo+'/';
  if(!url.pathname.startsWith(prefix)) throw new Error('source_path_not_allowlisted');
  if(!url.pathname.includes('/'+source.revision+'/')) throw new Error('source_revision_required');
  return url;
}

async function getText(url,source,timeoutMs=15000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(assertSafeUrl(url,source),{signal:controller.signal,headers:{accept:'text/plain'}});
    if(!res.ok) throw new Error(`source_http_${res.status}`);
    return await res.text();
  }finally{clearTimeout(timer);}
}

function sourceUrl(source,file){
  return `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${file}`;
}

function extractRows(markdown,query,limit=20){
  const q=String(query||'').trim().toLowerCase();
  if(!q) throw new Error('query_required');
  const terms=q.split(/\\s+/).filter(Boolean);
  const rows=[];
  for(const line of markdown.split('\\n')){
    if(!/^\\|/.test(line) || /^\\|\\s*-+/.test(line)) continue;
    const m=line.match(/^\\|\\s*(.*?)\\s*\\|\\s*(.*?)\\s*\\|/);
    if(!m) continue;
    const hay=(m[1]+' '+m[2]).toLowerCase();
    if(terms.every(t=>hay.includes(t))) rows.push({name:m[1],description:m[2]});
    if(rows.length>=limit) break;
  }
  return rows;
}

export async function runCapabilitySources(input={}){
  const task=input.task||{};
  const action=input.action||'health';
  if(!ALLOWED_ACTIONS.has(action)) throw new Error('action_not_allowed');
  if(action!=='health' && !(task.allowedActions||[]).includes('capability_sources_read')) throw new Error('capability_sources_read_not_authorized');

  if(action==='health'){
    return {executionId:`capability-sources-${Date.now()}`,target:'five-source-capability-set',result:{status:200,mode:'read_only',sourceCount:Object.keys(SOURCES).length,sourceRevisions:Object.fromEntries(Object.entries(SOURCES).map(([k,v])=>[k,v.revision]))}};
  }

  const sourceId=String(input.source||'');
  if(action==='sources'){
    const selected=sourceId?SOURCES[sourceId]:null;
    if(sourceId && !selected) throw new Error('source_not_supported');
    const list=selected?[[sourceId,selected]]:Object.entries(SOURCES);
    return {executionId:`capability-sources-${Date.now()}`,target:'five-source-capability-set',result:{status:200,sources:list.map(([id,s])=>({id,...s}))}};
  }

  const source=SOURCES[sourceId];
  if(!source) throw new Error('source_not_supported');
  const file=String(input.file||source.files[0]);
  if(!source.files.includes(file)) throw new Error('file_not_allowlisted');
  const markdown=await getText(sourceUrl(source,file),source);
  const limit=Math.min(Math.max(Number(input.limit||20),1),50);

  if(action==='inspect'){
    return {executionId:`capability-sources-${Date.now()}`,target:`${source.repo}:${file}`,result:{status:200,source:sourceId,repo:source.repo,file,sourceRevision:source.revision,bytes:Buffer.byteLength(markdown,'utf8'),preview:markdown.slice(0,Math.min(markdown.length,Number(input.maxBytes||6000)))}};
  }

  return {executionId:`capability-sources-${Date.now()}`,target:`${source.repo}:${file}`,result:{status:200,source:sourceId,repo:source.repo,file,sourceRevision:source.revision,count:extractRows(markdown,input.query,limit).length,results:extractRows(markdown,input.query,limit)}};
}

export function verifyCapabilitySourcesResult({result}={}){
  const ok=Boolean(result?.result?.status===200 && result.executionId && result.target);
  return {verifierId:'capability-sources-independent-verifier-v1',passed:ok,errors:ok?[]:['missing_valid_capability_source_execution']};
}
