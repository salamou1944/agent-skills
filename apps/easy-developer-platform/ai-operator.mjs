import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import crypto from 'node:crypto';

const SAFE_EXTENSIONS=/\.(mjs|js|cjs)$/i;
const MAX_FILES=500;

function now(){return new Date().toISOString()}
function result(status,step,details={}){return {id:crypto.randomUUID(),at:now(),status,step,...details}}
async function walk(dir,base=dir,out=[]){for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=join(dir,e.name);if(e.isDirectory())await walk(p,base,out);else out.push(relative(base,p));if(out.length>MAX_FILES)break}return out}
function run(command,args,cwd,timeout=15000){return new Promise(resolveResult=>{const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false});let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');resolveResult({ok:false,error:'timeout',stdout,stderr})},timeout);child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('error',e=>{clearTimeout(timer);resolveResult({ok:false,error:e.message,stdout,stderr})});child.on('close',(code,signal)=>{clearTimeout(timer);resolveResult({ok:code===0,code,signal,stdout,stderr})})})}

export function plan(goal){
 const text=String(goal||'').trim();
 if(!text)throw new Error('goal_required');
 const lower=text.toLowerCase();
 const steps=['inspect_workspace','guardian_scan','syntax_verification','verification_report'];
 if(/deploy|publish|production|delete|destroy|credential|secret|security|hack|attack/.test(lower))steps.splice(3,0,'approval_gate');
 return {id:crypto.randomUUID(),goal:text,steps,mode:'fail-closed',provider:'deterministic-core',createdAt:now()};
}

export async function execute(goal,{workspace='.',allowHighRisk=false}={}){
 const root=resolve(workspace),p=plan(goal),evidence=[];
 const files=await walk(root);
 evidence.push(result('passed','inspect_workspace',{fileCount:files.length,files:files.slice(0,MAX_FILES)}));
 const sensitive=[];
 for(const f of files){if(!SAFE_EXTENSIONS.test(f))continue;const content=await readFile(join(root,f),'utf8');if(/(?:api[_-]?key|password|secret|private[_-]?key|token)\s*[:=]\s*(?!process\.env\.)["'`]/i.test(content))sensitive.push(f)}
 evidence.push(result(sensitive.length?'blocked':'passed','guardian_scan',{sensitiveFiles:sensitive}));
 if(sensitive.length)return {status:'BLOCKED',plan:p,evidence,summary:'Execution blocked by Guardian evidence'};
 const js=files.filter(f=>SAFE_EXTENSIONS.test(f));const syntax=[];
 for(const f of js.slice(0,100)){const r=await run(process.execPath,['--check',join(root,f)],root);syntax.push({path:f,ok:r.ok,error:r.error,stderr:r.stderr?.slice(0,1000)})}
 const bad=syntax.filter(x=>!x.ok);
 evidence.push(result(bad.length?'failed':'passed','syntax_verification',{checked:syntax.length,failures:bad}));
 if(bad.length)return {status:'FAILED',plan:p,evidence,summary:'Syntax verification failed'};
 if(p.steps.includes('approval_gate')&&!allowHighRisk)return {status:'BLOCKED',plan:p,evidence,summary:'High-risk action requires explicit approval'};
 evidence.push(result('passed','verification_report',{checks:evidence.length+1}));
 return {status:'VERIFIED',plan:p,evidence,summary:'Goal inspection and safe verification completed; no external provider execution was claimed'};
}

if(import.meta.url===`file://${process.argv[1]}`){
 const goal=process.argv.slice(2).join(' ');execute(goal,{workspace:process.env.EASY_OPERATOR_WORKSPACE||'.'}).then(x=>console.log(JSON.stringify(x,null,2))).catch(e=>{console.error(JSON.stringify({status:'FAILED',error:e.message},null,2));process.exitCode=1});
}
