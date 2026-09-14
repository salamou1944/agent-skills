import { getBranch } from './github-provider.mjs';

const githubToken = () =>
  process.env.GITHUB_TOKEN ||
  process.env.EASY_GITHUB_TOKEN ||
  process.env.Easy_github_token;

export async function checkGithubConnection({owner='salamou1944',repo='agent-skills',branch='main',token=githubToken(),baseUrl}={}){
  if(!token)return {status:'BLOCKED',provider:'github',reason:'github_token_required'};
  try{
    const result=await getBranch({owner,repo,branch,token,baseUrl});
    return {status:'VERIFIED',provider:'github',operation:'getBranch',evidence:{owner,repo,branch,sha:result.sha}};
  }catch(error){
    return {status:'FAILED',provider:'github',operation:'getBranch',reason:error.message||'github_connection_failed'};
  }
}

if(import.meta.url===`file://${process.argv[1]}`){
  const result=await checkGithubConnection({});
  console.log(JSON.stringify(result));
  if(result.status!=='VERIFIED')process.exitCode=1;
}
