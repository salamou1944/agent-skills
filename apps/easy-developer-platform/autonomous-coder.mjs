import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';

const MAX_FILE_BYTES=120000;
const MAX_CONTEXT_BYTES=900000;
const MAX_CHANGES=12;
const DEFAULT_PROVIDER_TIMEOUT_MS=45000;
const DEFAULT_RATE_LIMIT_WAIT_MS=120000;
const ALLOWED=/\.(mjs|js|cjs|json|md|yml|yaml)$/i;
const FORBIDDEN=/(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx)|secrets?(?:\/|\.)|credentials?(?:\/\.))/i;

function cfg(env=process.env){return {endpoint:env.EASY_OPERATOR_LLM_ENDPOINT||'https://api.openai.com/v1/chat/completions',model:env.EASY_OPERATOR_LLM_MODEL||'gpt-4o-mini',apiKey:env.EASY_OPERATOR_LLM_API_KEY||env.OPENAI_API_KEY||env.EASY_OPENAI_API_KEY||'',modelFallback:env.EASY_OPERATOR_LLM_FALLBACK_MODEL||'',secondaryEndpoint:env.EASY_OPERATOR_SECONDARY_LLM_ENDPOINT||'',secondaryModel:env.EASY_OPERATOR_SECONDARY_LLM_MODEL||'',secondaryApiKey:env.EASY_OPERATOR_SECONDARY_LLM_API_KEY||'',githubEndpoint:env.EASY_OPERATOR_GITHUB_MODELS_ENDPOINT||'',githubModel:env.EASY_OPERATOR_GITHUB_MODELS_MODEL||'openai/gpt-4o-mini',githubToken:env.GITHUB_TOKEN||'',planFile:env.EASY_OPERATOR_PLAN_FILE||'',maxAttempts:Math.max(1,Number(env.EASY_OPERATOR_CODER_ATTEMPTS||2)),providerRetries:Math.max(1,Number(env.EASY_OPERATOR_PROVIDER_RETRIES||3)),rateLimitWaitMs:Math.max(0,Number(env.EASY_OPERATOR_RATE_LIMIT_MAX_WAIT_MS||DEFAULT_RATE_LIMIT_WAIT_MS)),providerTimeoutMs:Math.max(1000,Number(env.EASY_OPERATOR_PROVIDER_TIMEOUT_MS||DEFAULT_PROVIDER_TIMEOUT_MS)),workspace:resolve(env.EASY_OPERATOR_WORKSPACE||'.')}}
function run(command,args,cwd,timeout=30000){return new Promise(resolveResult=>{const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false});let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');resolveResult({ok:false,error:'timeout',stdout,stderr})},timeout);child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('error',e=>{clearTimeout(timer);resolveResult({ok:false,error:e.message,stdout,stderr})});child.on('close',(code,signal)=>{clearTimeout(timer);resolveResult({ok:code===0,code,signal,stdout,stderr})})})}
async function walk(root,dir=root,out=[]){for(const entry of await (await import('node:fs/promises')).readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.easy'].includes(entry.name))continue;const p=join(dir,entry.name);if(entry.isDirectory())await walk(root,p,out);else{const rel=relative(root,p);if(ALLOWED.test(rel)&&!FORBIDDEN.test(rel))out.push(rel)}}return out}
function relevance(file,goal){const terms=String(goal).toLowerCase().split(/[^a-z0-9_-]+/).filter(x=>x.length>2);const lower=file.toLowerCase();let score=0;for(const term of terms)if(lower.includes(term))score+=3;if(/(^|\/)(skills\/|apps\/easy-developer-platform\/|apps\/revenue-engine\/)/i.test(file))score+=2;if(/(^|\/)(test|tests|README|package\.json)/i.test(file))score+=1;return score}
async function context(root,goal){const status=await run('git',['status','--short'],root),log=await run('git',['log','-8','--oneline','--decorate'],root),files=await walk(root);const priority=files.filter(f=>/^(skills\/elite-code-engineer|skills\/code-progress-supervisor|apps\/easy-developer-platform|tests?|test\/|README)/i.test(f));const ordered=[...new Set([...priority,...files])].sort((a,b)=>relevance(b,goal)-relevance(a,goal));let used=0;const selected=[];for(const file of ordered){if(used>=MAX_CONTEXT_BYTES)break;try{const text=await readFile(join(root,file),'utf8');if(text.length>MAX_FILE_BYTES)continue;selected.push(`\n--- ${file} ---\n${text}`);used+=text.length+file.length+10}catch{}}return {status:status.stdout,log:log.stdout,files:files.slice(0,1000),selected:selected.join('')}}
function extractJson(text){const cleaned=String(text||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();try{return JSON.parse(cleaned)}catch{const start=cleaned.indexOf('{'),end=cleaned.lastIndexOf('}');if(start<0||end<=start)throw new Error('provider_non_json');return JSON.parse(cleaned.slice(start,end+1))}}
function sleep(ms){return new Promise(resolveResult=>setTimeout(resolveResult,ms))}
function shouldRetry(status){return status===408||status===429||status>=500}
function parseRetryAfterMs(headers,now=Date.now()){const raw=headers?.get?.('retry-after');if(raw){const seconds=Number(raw);if(Number.isFinite(seconds)&&seconds>=0)return Math.round(seconds*1000);const date=Date.parse(raw);if(Number.isFinite(date))return Math.max(0,date-now)}for(const name of ['x-ratelimit-reset-requests','x-ratelimit-reset-tokens','x-ratelimit-reset']){const value=Number(headers?.get?.(name));if(!Number.isFinite(value)||value<0)continue;if(value>1e12)return Math.max(0,value-now);if(value>1e9)return Math.max(0,value*1000-now);return Math.max(0,value*1000)}return null}
function retryDelay(attempt,retryAfter,maxWaitMs=DEFAULT_RATE_LIMIT_WAIT_MS){const header=Number(retryAfter);if(Number.isFinite(header)&&header>=0)return Math.min(header,maxWaitMs);const base=Math.min(1000*2**(attempt-1),15000);return Math.min(base+Math.floor(Math.random()*250),maxWaitMs)}
function providerError(status){return `provider_http_${status}`}
function isRecoverableProviderError(error){return ['provider_http_408','provider_http_404','provider_http_410','provider_http_429','provider_quota_exhausted','provider_timeout'].includes(error.message)||/^provider_http_5\d\d$/.test(error.message)}

export async function requestInference(prompt,{endpoint,model,token,providerRetries=3,timeoutMs=DEFAULT_PROVIDER_TIMEOUT_MS,rateLimitWaitMs=DEFAULT_RATE_LIMIT_WAIT_MS,fetchImpl=fetch,sleepImpl=sleep,telemetry}={}){
  const started=Date.now();
  for(let attempt=1;attempt<=providerRetries;attempt++){
    const attemptStarted=Date.now();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetchImpl(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({model,messages:[{role:'system',content:'You are Elite Code, a senior autonomous software engineer. Return JSON only. Make minimal, evidence-driven repository changes. If no safe change is required, return an empty changes array. Never request or expose secrets. Never modify CI workflows, credentials, deployment configuration, or authentication policy.'},{role:'user',content:prompt}],temperature:0}),signal:controller.signal});
      if(response.ok){const body=await response.json(),text=body?.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())throw new Error('provider_empty');telemetry?.({endpoint,model,attempt,ok:true,status:response.status,latencyMs:Date.now()-attemptStarted,totalMs:Date.now()-started});return extractJson(text)}
      let rateLimitCode='';try{const body=await response.clone().json();rateLimitCode=String(body?.error?.code||body?.error?.type||'')}catch{}
      if(response.status===429&&(rateLimitCode==='insufficient_quota'||rateLimitCode==='quota_exceeded'))throw new Error('provider_quota_exhausted');
      if(response.status===410||response.status===404){telemetry?.({endpoint,model,attempt,ok:false,status:response.status,latencyMs:Date.now()-attemptStarted,totalMs:Date.now()-started});throw new Error(providerError(response.status))}
      if(!shouldRetry(response.status))throw new Error(providerError(response.status));
      const retryAfterMs=response.status===429?parseRetryAfterMs(response.headers):null;
      telemetry?.({endpoint,model,attempt,ok:false,status:response.status,retryAfterMs,latencyMs:Date.now()-attemptStarted,totalMs:Date.now()-started});
      if(attempt===providerRetries)throw new Error(providerError(response.status));
      await sleepImpl(retryDelay(attempt,retryAfterMs,rateLimitWaitMs));
    }catch(error){
      const timedOut=error?.name==='AbortError';
      if(timedOut){telemetry?.({endpoint,model,attempt,ok:false,status:'timeout',latencyMs:Date.now()-attemptStarted,totalMs:Date.now()-started});if(attempt===providerRetries)throw new Error('provider_timeout')}
      else if(error?.message==='provider_quota_exhausted'||error?.message==='provider_http_410'||error?.message==='provider_http_404')throw error;
      else if(String(error?.message||'').startsWith('provider_http_')){if(attempt===providerRetries)throw error}
      else throw error;
    }finally{clearTimeout(timer)}
  }
  throw new Error('provider_unavailable')
}

function providerLadder(c){const list=[];const add=(name,endpoint,model,token)=>{if(endpoint&&model&&token)list.push({name,endpoint,model,token})};add('primary',c.endpoint,c.model,c.apiKey);if(c.modelFallback)add('primary-model-fallback',c.endpoint,c.modelFallback,c.apiKey);add('secondary',c.secondaryEndpoint,c.secondaryModel,c.secondaryApiKey);add('github-copilot-compatible',c.githubEndpoint,c.githubModel,c.githubToken);return list}

export async function ask(prompt,c){
  const fetchImpl=c.fetchImpl||fetch;
  const sleepImpl=c.sleepImpl||sleep;
  const telemetry=c.telemetry;
  const ladder=providerLadder(c);
  if(!ladder.length)throw new Error('llm_provider_not_configured');
  const failures=[];
  for(const provider of ladder){
    try{return await requestInference(prompt,{endpoint:provider.endpoint,model:provider.model,token:provider.token,providerRetries:c.providerRetries,timeoutMs:c.providerTimeoutMs,rateLimitWaitMs:c.rateLimitWaitMs,fetchImpl,sleepImpl,telemetry})}
    catch(error){
      if(!isRecoverableProviderError(error))throw error;
      failures.push(`${provider.name}:${error.message}`);
      telemetry?.({provider:provider.name,event:'provider_fallback',reason:error.message});
    }
  }
  throw new Error(`all_providers_exhausted:${failures.join(',')}`)
}
function validateChanges(changes,root){if(!Array.isArray(changes)||changes.length>MAX_CHANGES)throw new Error('invalid_change_set');const paths=new Set();for(const c of changes){if(!c||typeof c.path!=='string'||paths.has(c.path)||c.path.startsWith('/')||c.path.includes('..')||!ALLOWED.test(c.path)||FORBIDDEN.test(c.path)||c.path.startsWith('.github/workflows/'))throw new Error(`unsafe_path:${c?.path}`);paths.add(c.path);if(typeof c.content!=='string'||c.content.length>200000)throw new Error(`invalid_content:${c.path}`);const target=resolve(root,c.path);if(target!==root&&!target.startsWith(root+'/'))throw new Error(`path_escape:${c.path}`)}}
async function snapshot(root,changes){const originals=new Map();for(const c of changes){try{originals.set(c.path,await readFile(join(root,c.path),'utf8'))}catch{originals.set(c.path,null)}}return originals}
async function apply(root,changes){for(const c of changes){const target=join(root,c.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,c.content,'utf8')}}
async function restore(root,originals){for(const [path,text] of originals){const target=join(root,path);if(text===null)await import('node:fs/promises').then(fs=>fs.rm(target,{force:true}));else await writeFile(target,text,'utf8')}}
async function verify(root,changes){const check=await run('git',['diff','--check'],root);if(!check.ok)return {ok:false,error:'git_diff_check_failed',details:check.stderr||check.stdout};for(const c of changes){if(/\.(mjs|js|cjs)$/i.test(c.path)){const r=await run(process.execPath,['--check',join(root,c.path)],root);if(!r.ok)return {ok:false,error:`syntax_failed:${c.path}`,details:r.stderr||r.stdout}}}return {ok:true}}
async function executePlan(plan,root,attempt=1){validateChanges(plan?.changes,root);if(plan.changes.length===0)return {status:'VERIFIED_NOOP',attempt,summary:plan.summary||'No safe change required',changedFiles:[]};const originals=await snapshot(root,plan.changes);await apply(root,plan.changes);const verification=await verify(root,plan.changes);if(verification.ok)return {status:'VERIFIED',attempt,summary:plan.summary||'Autonomous coding cycle verified',changedFiles:plan.changes.map(x=>x.path)};await restore(root,originals);throw new Error(`verification_failed:${JSON.stringify(verification)}`)}
async function practicalFallback(goal,root){if(!/ARMY-14\s+[A-Za-z-]+\s+soldier/i.test(String(goal)))throw new Error('practical_fallback_not_applicable');const runner=join(root,'.elite-code-tools','apps','easy-developer-platform','army-14-practical-runner.mjs');const result=await run(process.execPath,[runner,goal],root,180000);if(!result.ok)throw new Error(`practical_fallback_failed:${result.stderr||result.stdout}`);return {status:'VERIFIED_PRACTICAL_FALLBACK',attempt:0,summary:'Provider-independent ARMY-14 practical verification completed',changedFiles:[],evidence:result.stdout}}
export async function execute(goal,{env=process.env}={}){const c=cfg(env),root=c.workspace,telemetryEvents=[];c.telemetry=e=>telemetryEvents.push({...e,at:new Date().toISOString()});if(c.planFile){const plan=extractJson(await readFile(c.planFile,'utf8'));return executePlan(plan,root,1)}if(!c.apiKey&&!c.githubToken&&!c.secondaryApiKey){if(/ARMY-14\s+[A-Za-z-]+\s+soldier/i.test(String(goal)))return {...await practicalFallback(goal,root),providerTelemetry:telemetryEvents};throw new Error('llm_provider_not_configured')}let lastError='',ctx=null;for(let attempt=1;attempt<=c.maxAttempts;attempt++){ctx ||= await context(root,goal);const prompt=`Goal: ${goal}\n\nCurrent repository context:\n${JSON.stringify(ctx)}\n\nPrevious verification failure (empty on first attempt): ${lastError}\n\nReturn exactly this JSON shape: {"summary":"...","changes":[]}. The changes array may be empty when the goal is already satisfied or no safe change is justified. Otherwise choose the smallest safe set of changes that advances the goal. Do not edit CI workflows or secrets. Do not commit or push.`;let plan;try{plan=await ask(prompt,c)}catch(error){if(String(error?.message||'').startsWith('all_providers_exhausted:')&&/ARMY-14\s+[A-Za-z-]+\s+soldier/i.test(String(goal)))return {...await practicalFallback(goal,root),providerTelemetry:telemetryEvents};throw error}try{return {...await executePlan(plan,root,attempt),providerTelemetry:telemetryEvents}}catch(error){lastError=error.message}}throw new Error(`verification_failed:${lastError}`)}
if(import.meta.url===`file://${process.argv[1]}`){const goal=process.argv.slice(2).join(' ').trim();if(!goal){console.error('goal_required');process.exit(2)}execute(goal).then(x=>console.log(JSON.stringify(x,null,2))).catch(e=>{console.error(JSON.stringify({status:'FAILED',error:e.message},null,2));process.exit(1)})}
