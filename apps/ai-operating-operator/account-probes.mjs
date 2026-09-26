const probes={
  github:{tokenEnv:'GITHUB_TOKEN',url:'https://api.github.com/user',headers:t=>({authorization:`Bearer ${t}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'})},
  railway:{tokenEnv:'RAILWAY_TOKEN',url:'https://backboard.railway.com/graphql/v2',method:'POST',body:JSON.stringify({query:'query { me { id } }'}),headers:t=>({authorization:`Bearer ${t}`,'content-type':'application/json'})},
  vercel:{tokenEnv:'VERCEL_TOKEN',url:'https://api.vercel.com/v2/user',headers:t=>({authorization:`Bearer ${t}`})},
  supabase:{tokenEnv:'SUPABASE_ACCESS_TOKEN',url:'https://api.supabase.com/v1/projects',headers:t=>({authorization:`Bearer ${t}`})}
};
async function probeEndpoint(env,key){const raw=env[key];if(!raw)return {configured:false,authorized:false,reachable:false,canRead:false,canWrite:false,canDeploy:false};try{const u=new URL(raw);if(u.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(u.hostname))throw new Error('https_required');const r=await fetch(new URL('/',u),{signal:AbortSignal.timeout(10000)});return {configured:true,authorized:true,reachable:true,canRead:r.ok,canWrite:false,canDeploy:false,status:r.status}}catch{return {configured:true,authorized:true,reachable:false,canRead:false,canWrite:false,canDeploy:false,errorClass:'network'}}}
export async function probeAccounts(env=process.env){
  const out={};
  for(const [name,p] of Object.entries(probes)){const token=env[p.tokenEnv];if(!token){out[name]={configured:false,authorized:false,reachable:false,canRead:false,canWrite:false,canDeploy:false};continue}try{const r=await fetch(p.url,{method:p.method||'GET',headers:p.headers(token),body:p.body,signal:AbortSignal.timeout(10000)});out[name]={configured:true,authorized:r.ok,reachable:true,canRead:r.ok,canWrite:false,canDeploy:false,status:r.status}}catch{out[name]={configured:true,authorized:true,reachable:false,canRead:false,canWrite:false,canDeploy:false,errorClass:'network'}}}
  out['browser.automation']=await probeEndpoint(env,'OPERATOR_BROWSER_URL');
  out['research.search']=await probeEndpoint(env,'OPERATOR_SEARXNG_URL');
  out['research.read']=await probeEndpoint(env,'OPERATOR_JINA_URL');
  out['ai.local.ollama']=await probeEndpoint(env,'OPERATOR_OLLAMA_URL');
  return out;
}
