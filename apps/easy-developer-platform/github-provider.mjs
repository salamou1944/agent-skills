const API='https://api.github.com';

function required(value,name){if(!value)throw new Error(`${name}_required`);return value}
function headers(token){return {'accept':'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','authorization':`Bearer ${required(token,'github_token')}`}}
async function request(path,token,options={}){
 const response=await fetch(`${API}${path}`,{...options,headers:{...headers(token),...(options.headers||{})}});
 const text=await response.text(); let body=null; try{body=text?JSON.parse(text):null}catch{body={raw:text.slice(0,2000)}}
 if(!response.ok)throw new Error(`github_http_${response.status}:${body?.message||'request_failed'}`);
 return body;
}

export function githubProviderStatus(env=process.env){
 const token=env.GITHUB_TOKEN||env.EASY_GITHUB_TOKEN;
 return {provider:'github',configured:Boolean(token),verified:false,reason:token?'provider_configured_unverified':'provider_not_configured',required:['getBranch','writeFile','commit','openPullRequest']};
}

export async function getBranch({owner,repo,branch='main',token=process.env.GITHUB_TOKEN||process.env.EASY_GITHUB_TOKEN}){
 const data=await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,token);
 return {name:data.name,sha:data.commit.sha,protected:Boolean(data.protected)};
}

export async function getFile({owner,repo,path,ref='main',token=process.env.GITHUB_TOKEN||process.env.EASY_GITHUB_TOKEN}){
 const data=await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`,token);
 if(Array.isArray(data))throw new Error('github_path_is_directory');
 return {path:data.path,sha:data.sha,content:data.content,encoding:data.encoding,download_url:data.download_url};
}

export async function writeFile({owner,repo,path,content,message,branch='main',token=process.env.GITHUB_TOKEN||process.env.EASY_GITHUB_TOKEN}){
 required(message,'commit_message');
 const existing=await getFile({owner,repo,path,ref:branch,token}).catch(error=>error.message==='github_http_404:Not Found'?null:Promise.reject(error));
 const body={message,content:Buffer.from(String(content),'utf8').toString('base64'),branch};
 if(existing)body.sha=existing.sha;
 const data=await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`,token,{method:'PUT',body:JSON.stringify(body)});
 return {path:data.content.path,sha:data.content.sha,commitSha:data.commit.sha,branch};
}

export async function openPullRequest({owner,repo,title,head,base='main',body='',token=process.env.GITHUB_TOKEN||process.env.EASY_GITHUB_TOKEN}){
 required(title,'pr_title');required(head,'pr_head');
 const data=await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,token,{method:'POST',body:JSON.stringify({title,head,base,body})});
 return {number:data.number,url:data.html_url,state:data.state,head:data.head.ref,base:data.base.ref};
}

export const GITHUB_PROVIDER_CONTRACT=Object.freeze(['getBranch','getFile','writeFile','openPullRequest']);
