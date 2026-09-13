import { createBranch, getBranch, writeFile, openPullRequest } from './github-provider.mjs';

const FORBIDDEN=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx))$|(^|\/)(?:secrets?|credentials?)(?:\/|\.)/i;
const ALLOWED=/\.(?:mjs|js|cjs|json|md|yml|yaml)$/i;

function required(value,name){if(value===undefined||value===null||value==='')throw new Error(`${name}_required`);return value}
function safePath(path){return typeof path==='string'&&path.length>0&&path.length<=300&&!path.startsWith('/')&&!path.includes('..')&&ALLOWED.test(path)&&!FORBIDDEN.test(path)}
function branchName(){return `ai-operator/${Date.now()}-${Math.random().toString(36).slice(2,8)}`}

export async function executeGithubChange({owner,repo,base='main',changes,title,body='',approved=false,token,baseUrl}={}){
 required(owner,'owner');required(repo,'repo');required(changes,'changes');required(title,'pr_title');
 if(!approved)return {status:'WAITING_APPROVAL',reason:'explicit_approval_required'};
 if(!token)return {status:'BLOCKED',reason:'github_token_required'};
 if(!Array.isArray(changes)||changes.length===0)return {status:'BLOCKED',reason:'changes_required'};
 if(changes.length>20)return {status:'BLOCKED',reason:'change_limit_exceeded'};
 for(const change of changes){
   if(!change||!safePath(change.path))return {status:'BLOCKED',reason:'path_not_allowlisted',path:change?.path};
   if(typeof change.content!=='string'||change.content.length>200000)return {status:'BLOCKED',reason:'content_invalid',path:change?.path};
 }
 const baseInfo=await getBranch({owner,repo,branch:base,token,baseUrl});
 const branch=branchName();
 const created=await createBranch({owner,repo,branch,fromSha:baseInfo.sha,token,baseUrl});
 const writes=[];
 for(const change of changes){
   writes.push(await writeFile({owner,repo,path:change.path,content:change.content,message:change.message||`ai-operator: update ${change.path}`,branch,token,baseUrl}));
 }
 const pr=await openPullRequest({owner,repo,title,head:branch,base,body,token,baseUrl});
 return {status:'VERIFIED',evidence:{base:{branch:base,sha:baseInfo.sha},branch:created,writes,pr},merge:'not_performed'};
}

export const GITHUB_OPERATOR_RULES=Object.freeze({approvalRequired:true,branchIsolated:true,mergeAutomatic:false,maxChanges:20,allowedExtensions:['mjs','js','cjs','json','md','yml','yaml'],secretPathsBlocked:true});
