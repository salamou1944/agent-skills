import { checkGithubConnection } from './external-connection-check.mjs';

const RAILWAY_API='https://backboard.railway.com/graphql/v2';

async function railwayRequest(query, variables={}, token=process.env.RAILWAY_TOKEN, projectToken=process.env.RAILWAY_PROJECT_ACCESS_TOKEN){
  const headers={'content-type':'application/json'};
  if(projectToken) headers['Project-Access-Token']=projectToken;
  else if(token) headers.authorization=`Bearer ${token}`;
  else return {ok:false,reason:'railway_token_required'};
  const response=await fetch(RAILWAY_API,{method:'POST',headers,body:JSON.stringify({query,variables})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.errors?.length)return {ok:false,reason:body.errors?.[0]?.message||`railway_http_${response.status}`};
  return {ok:true,data:body.data};
}

export async function checkRailwayConnection({projectId=process.env.RAILWAY_PROJECT_ID,environmentId=process.env.RAILWAY_ENVIRONMENT_ID}={}){
  if(!projectId)return {status:'BLOCKED',provider:'railway',reason:'railway_project_id_required'};
  if(process.env.RAILWAY_PROJECT_ACCESS_TOKEN){
    const result=await railwayRequest('query { projectToken { projectId environmentId } }',{});
    if(!result.ok)return {status:'FAILED',provider:'railway',reason:result.reason};
    const info=result.data?.projectToken;
    const verified=info?.projectId===projectId&&(!environmentId||info.environmentId===environmentId);
    return verified?{status:'VERIFIED',provider:'railway',operation:'projectToken',evidence:{projectId:info.projectId,environmentId:info.environmentId}}:{status:'FAILED',provider:'railway',reason:'project_token_scope_mismatch'};
  }
  if(!process.env.RAILWAY_TOKEN)return {status:'BLOCKED',provider:'railway',reason:'railway_token_required'};
  const result=await railwayRequest('query($id:String!){ project(id:$id){ id name } }',{id:projectId});
  if(!result.ok)return {status:'FAILED',provider:'railway',reason:result.reason};
  const project=result.data?.project;
  return project?.id===projectId?{status:'VERIFIED',provider:'railway',operation:'project',evidence:{projectId:project.id,name:project.name,environmentId:environmentId||null}}:{status:'FAILED',provider:'railway',reason:'project_not_found'};
}

export async function providerReadiness(){
  const github=await checkGithubConnection({owner:process.env.EASY_GITHUB_OWNER||'salamou1944',repo:process.env.EASY_GITHUB_REPO||'agent-skills',branch:process.env.EASY_GITHUB_BRANCH||'main'});
  const railway=await checkRailwayConnection();
  const deterministic={status:'VERIFIED',provider:'deterministic-core',operation:'local-safe-verification'};
  const externalReady=github.status==='VERIFIED'&&railway.status==='VERIFIED';
  return {status:externalReady?'VERIFIED':'BLOCKED',externalExecution:externalReady?'READY':'FAIL_CLOSED',providers:{github,railway,deterministic},checkedAt:new Date().toISOString()};
}
