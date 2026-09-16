import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';

const MAX_FILE_BYTES=120000;
const MAX_CONTEXT_BYTES=900000;
const MAX_CHANGES=12;
const ALLOWED=/\.(mjs|js|cjs|json|md|yml|yaml)$/i;
const FORBIDDEN=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/\.))/i;

function cfg(env=process.env){return {endpoint:env.EASY_OPERATOR_LLM_ENDPOINT||'https://api.openai.com/v1/chat/completions',model:env.EASY_OPERATOR_LLM_MODEL||'gpt-4o-mini',apiKey:env.EASY_OPERATOR_LLM_API_KEY||env.OPENAI_API_KEY||env.EASY_OPENAI_API_KEY||'',githubEndpoint:env.EASY_OPERATOR_GITHUB_MODELS_ENDPOINT||'https://models.github.ai/inference',githubModel:env.EASY_OPERATOR_GITHUB_MODELS_MODEL||'openai/gpt-4o-mini',githubToken:env.GITHUB_TOKEN||'',planFile:env.EASY_OPERATOR_PLAN_FILE||'',maxAttempts:Math.max(1,Number(env.EASY_OPERATOR_CODER_ATTEMPTS||2)),providerRetries:Math.max(1,Number(env.EASY_OPERATOR_PROVIDER_RETRIES||3)),workspace:resolve(env.EASY_OPERATOR_WORKSPACE||'.')}}
function run(command,args,cwd,timeout=30000){return new Promise(resolveResult=>{const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false});let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');resolveResult({ok:false,error:'timeout',stdout,stderr})},timeout);child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('error',e=>{clearTimeout(timer);resolveResult({ok:false,error:e.message,stdout,stderr})});child.on('close',(code,signal)=>{clearTimeout(timer);resolveResult({ok:code===0,code,signal,stdout,stderr})})})}
async function walk(root,dir=root,out=[]){for(const entry of await (await import('node:fs/promises')).readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.easy'].includes(entry.name))continue;const p=join(dir,entry.name);if(entry.isDirectory())await walk(root,p,out);else{const rel=relative(root,p);if(ALLOWED.test(rel)&&!FORBIDDEN.test(rel))out.push(rel)}}return out}
async function context(root){const status=await run('git',['status','--short'],root),log=await run('git',['log','-8','--oneline','--decorate'],root),files=await walk(root);const priority=files.filter(f=>/^(skills\/elite-code-engineer|skills\/code-progress-supervisor|apps\/easy-developer-platform|tests?|test\/|README)/i.test(f)),ordered=[...priority,...files.filter(f=>!priority.includes(f))];let used=0;const selected=[];for(const file of ordered){if(used>=MAX_CONTEXT_BYTES)break;try{const text=await readFile(join(root,file),'utf8');if(text.length>MAX_FILE_BYTES)continue;selected.push(`\n--- ${file} ---\n${text}`);used+=text.length+file.length+10}catch{}}return {status:status.stdout,log:log.stdout,files:files.slice(0,1000),selected:selected.join('')}}
function extractJson(text){const cleaned=String(text||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();try{return JSON.parse(cleaned)}catch{const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}');if(start<0||end<=start)throw new Error('provider_non_json');return JSON.parse(cleaned.slice(start,end+1))}}
function sleep(ms){return new Promise(resolveResult=>setTimeout(resolveResult,ms))}

export async function requestInference(prompt,{endpoint,model,token,providerRetries=3,fetchImpl=fetch}){
  for(let attempt=1;attempt<=providerRetries;attempt++){
    const response=await fetchImpl(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({model,messages:[{role:'system',content:'You are Elite Code, a senior autonomous software engineer. Return JSON only. Make minimal, evidence-driven repository changes. If no safe change is required, return an empty changes array. Never request or expose secrets. Never modify CI workflows, credentials, deployment configuration, or authentication policy.'},{role:'user',content:prompt}],temperature:0})});
    if(response.ok){const body=await response.json(),text=body?.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())throw new Error('provider_empty');return extractJson(text)}
    if(response.status!==429)throw new Error(`provider_http_${response.status}`);
    let rateLimitCode='';
    try{const body=await response.clone().json();rateLimitCode=String(body?.error?.code||body?.error?.type||'')}catch{}
    if(rateLimitCode==='insufficient_quota'||rateLimitCode==='quota_exceeded')throw new Error('provider_quota_exhausted');
    if(attempt===providerRetries)throw new Error('provider_http_429');
    const retryAfter=Number(response.headers.get('retry-after')),delay=Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,30000):Math.min(2000*2**(attempt-1),30000);await sleep(delay)
  }
  throw new Error('provider_http_429')
}

export async function ask(prompt,c){
  const fetchImpl=c.fetchImpl||fetch;
  if(c.apiKey){try{return await requestInference(prompt,{endpoint:c.endpoint,model:c.model,token:c.apiKey,providerRetries:c.providerRetries,fetchImpl})}catch(error){if(!['provider_http_429','provider_quota_exhausted'].includes(error.message)||!c.githubToken)throw error}}
  if(c.githubToken)return requestInference(prompt,{endpoint:c.githubEndpoint,model:c.githubModel,token:c.githubToken,providerRetries:2,fetchImpl});
  if(c.apiKey)throw new Error('provider_http_429');
  throw new Error('llm_provider_not_configured')
}
function validateChanges(changes,root){if(!Array.isArray(changes)||changes.length>MAX_CHANGES)throw new Error('invalid_change_set');for(const c of changes){if(!c||typeof c.path!=='string'||c.path.startsWith('/')||c.path.includes('..')||!ALLOWED.test(c.path)||FORBIDDEN.test(c.path)||c.path.startsWith('.github/workflows/'))throw new Error(`unsafe_path:${c?.path}`);if(typeof c.content!=='string'||c.content.length>200000)throw new Error(`invalid_content:${c.path}`);const target=resolve(root,c.path);if(target!==root&&!target.startsWith(root+'/'))throw new Error(`path_escape:${c.path}`)}}
async function snapshot(root,changes){const originals=new Map();for(const c of changes){try{originals.set(c.path,await readFile(join(root,c.path),'utf8'))}catch{originals.set(c.path,null)}}return originals}
async function apply(root,changes){for(const c of changes){const target=join(root,c.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,c.content,'utf8')}}
async function restore(root,originals){for(const [path,text] of originals){const target=join(root,path);if(text===null)await import('node:fs/promises').then(fs=>fs.rm(target,{force:true}));else await writeFile(target,text,'utf8')}}
async function verify(root,changes){const check=await run('git',['diff','--check'],root);if(!check.ok)return {ok:false,error:'git_diff_check_failed',details:check.stderr||check.stdout};for(const c of changes){if(/\.(mjs|js|cjs)$/i.test(c.path)){const r=await run(process.execPath,['--check',join(root,c.path)],root);if(!r.ok)return {ok:false,error:`syntax_failed:${c.path}`,details:r.stderr||r.stdout}}}return {ok:true}}
async function executePlan(plan,root,attempt=1){validateChanges(plan?.changes,root);if(plan.changes.length===0)return {status:'VERIFIED_NOOP',attempt,summary:plan.summary||'No safe change required',changedFiles:[]};const originals=await snapshot(root,plan.changes);await apply(root,plan.changes);const verification=await verify(root,plan.changes);if(verification.ok)return {status:'VERIFIED',attempt,summary:plan.summary||'Autonomous coding cycle verified',changedFiles:plan.changes.map(x=>x.path)};await restore(root,originals);throw new Error(`verification_failed:${JSON.stringify(verification)}`)}
export async function execute(goal,{env=process.env}={}){const c=cfg(env),root=c.workspace;if(c.planFile){const plan=extractJson(await readFile(c.planFile,'utf8'));return executePlan(plan,root,1)}if(!c.apiKey&&!c.githubToken)throw new Error('llm_provider_not_configured');let lastError='';for(let attempt=1;attempt<=c.maxAttempts;attempt++){const ctx=await context(root),prompt=`Goal: ${goal}\n\nCurrent repository context:\n${JSON.stringify(ctx)}\n\nPrevious verification failure (empty on first attempt): ${lastError}\n\nReturn exactly this JSON shape: {"summary":"...","changes":[]}. The changes array may be empty when the goal is already satisfied or no safe change is justified. Otherwise choose the smallest safe set of changes that advances the goal. Do not edit CI workflows or secrets. Do not commit or push.`;const plan=await ask(prompt,c);try{return await executePlan(plan,root,attempt)}catch(error){lastError=error.message}}throw new Error(`verification_failed:${lastError}`)}
if(import.meta.url===`file://${process.argv[1]}`){const goal=process.argv.slice(2).join(' ').trim();if(!goal){console.error('goal_required');process.exit(2)}execute(goal).then(x=>console.log(JSON.stringify(x,null,2))).catch(e=>{console.error(JSON.stringify({status:'FAILED',error:e.message},null,2));process.exit(1)})}
