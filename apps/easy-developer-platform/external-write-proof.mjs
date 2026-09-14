import { executeGithubChange } from './github-operator-executor.mjs';

const owner=process.env.GITHUB_REPOSITORY_OWNER||'salamou1944';
const repo=(process.env.GITHUB_REPOSITORY||'salamou1944/agent-skills').split('/')[1];
const token=process.env.EASY_GITHUB_TOKEN||process.env.GITHUB_TOKEN;
const tokenSource=process.env.EASY_GITHUB_TOKEN?'EASY_GITHUB_TOKEN':(process.env.GITHUB_TOKEN?'GITHUB_TOKEN':'none');
const marker=`EASY external write proof ${new Date().toISOString()}`;

if(!token){
  console.log(JSON.stringify({status:'BLOCKED',reason:'github_token_required',tokenSource}));
  process.exitCode=1;
}else{
  console.log(JSON.stringify({status:'VERIFIED',credentialSource:tokenSource,credentialValueExposed:false}));
  const result=await executeGithubChange({
    owner,repo,base:'main',approved:true,token,
    title:'ci: external GitHub write permission proof',
    body:'Automated temporary proof of branch creation, file write, and pull request creation. This PR is closed automatically after verification and is never merged.',
    changes:[{path:'docs/external-connection-proof.md',content:`${marker}\n`,message:'ci: prove external GitHub write path'}]
  });

  if(result.status!=='VERIFIED'){
    console.log(JSON.stringify(result));
    process.exitCode=1;
  }else{
    const branch=result.evidence.branch.name;
    const pr=result.evidence.pr.number;
    const api='https://api.github.com';
    const headers={'accept':'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','authorization':`Bearer ${token}`};
    const request=async(path,options={})=>{const r=await fetch(`${api}${path}`,{...options,headers});const text=await r.text();if(!r.ok)throw new Error(`cleanup_http_${r.status}:${text.slice(0,500)}`);return text?JSON.parse(text):null};
    await request(`/repos/${owner}/${repo}/pulls/${pr}`,{method:'PATCH',body:JSON.stringify({state:'closed'})});
    await request(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,{method:'DELETE'});
    console.log(JSON.stringify({status:'VERIFIED',operations:['getBranch','createBranch','writeFile','openPullRequest'],pr,branch,cleanup:'closed_pr_and_deleted_branch'}));
  }
}
