const API='https://api.github.com';
const defaultHeaders=t=>({authorization:`Bearer ${t}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','content-type':'application/json'});
function allowedRepo(repo,env=process.env){const list=String(env.OPERATOR_GITHUB_REPOS||'').split(',').map(x=>x.trim()).filter(Boolean);return list.includes(repo);}
function b64(s){return Buffer.from(String(s),'utf8').toString('base64');}
export async function runGitHub(input={},env=process.env){
  const token=env.GITHUB_TOKEN;if(!token)throw new Error('github_token_required');
  const repo=String(input.repo||'').trim();if(!repo||!allowedRepo(repo,env))throw new Error('github_repo_not_allowlisted');
  const action=String(input.action||'read_repo');
  const mutation=new Set(['write_file','create_pr']).has(action);
  if(mutation&&!Array.isArray(input.task?.allowedActions)||!input.task.allowedActions.includes('write'))throw new Error('github_write_not_authorized');
  const path=input.path?'/contents/'+input.path.replace(/^\//,''):'';
  let url=`${API}/repos/${repo}`;
  let method='GET',body;
  if(action==='read_repo'){method='GET';}
  else if(action==='read_file'){if(!path)throw new Error('github_path_required');url+=path;method='GET';}
  else if(action==='write_file'){
    if(!path||!input.content)throw new Error('github_write_input_required');
    url+=path;method='PUT';body={message:String(input.message||'operator change'),content:b64(input.content),branch:String(input.branch||'main')};if(input.sha)body.sha=input.sha;
  } else if(action==='create_pr'){
    if(!input.head||!input.base||!input.title)throw new Error('github_pr_input_required');
    url+='/pulls';method='POST';body={title:String(input.title),head:String(input.head),base:String(input.base),body:String(input.body||'')};
  } else throw new Error('github_action_not_registered');
  const r=await fetch(url,{method,headers:defaultHeaders(token),body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  let data=null;try{data=await r.json();}catch{}
  return {executionId:crypto.randomUUID(),adapter:'platform.github',action,repo,status:r.status,ok:r.ok,data:data?{...data,content:undefined}:null};
}
import crypto from 'node:crypto';
