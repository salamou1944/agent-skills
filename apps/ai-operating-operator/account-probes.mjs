const probes={
  github:{tokenEnv:'GITHUB_TOKEN',url:'https://api.github.com/user',headers:t=>({authorization:`Bearer ${t}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'})},
  railway:{tokenEnv:'RAILWAY_TOKEN',url:'https://backboard.railway.com/graphql/v2',method:'POST',body:JSON.stringify({query:'query { me { id } }'}),headers:t=>({authorization:`Bearer ${t}`,'content-type':'application/json'})},
  vercel:{tokenEnv:'VERCEL_TOKEN',url:'https://api.vercel.com/v2/user',headers:t=>({authorization:`Bearer ${t}`})},
  supabase:{tokenEnv:'SUPABASE_ACCESS_TOKEN',url:'https://api.supabase.com/v1/projects',headers:t=>({authorization:`Bearer ${t}`})}
};
export async function probeAccounts(env=process.env){
  const out={};
  for(const [name,p] of Object.entries(probes)){
    const token=env[p.tokenEnv];
    if(!token){out[name]={configured:false,authorized:false,reachable:false,canRead:false,canWrite:false,canDeploy:false};continue;}
    try{
      const r=await fetch(p.url,{method:p.method||'GET',headers:p.headers(token),body:p.body,signal:AbortSignal.timeout(10000)});
      const ok=r.ok;
      out[name]={configured:true,authorized:ok,reachable:true,canRead:ok,canWrite:false,canDeploy:false,status:r.status};
    }catch(error){
      out[name]={configured:true,authorized:true,reachable:false,canRead:false,canWrite:false,canDeploy:false,errorClass:'network'};
    }
  }
  return out;
}
